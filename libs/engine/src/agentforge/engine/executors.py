from collections.abc import AsyncIterator
from typing import Any

import httpx
from agentforge.engine.context import NodeContext
from agentforge.providers import AnthropicProvider, OpenAIProvider, ProviderMessage
from agentforge.schemas import (
    AgentConfig,
    ConstantConfig,
    NodeEvent,
    NodeOutput,
    NodeRole,
    RouterConfig,
    TokenChunk,
    ToolConfig,
)


class ConstantExecutor:
    """Source node that emits a fixed, configured value."""

    type = "constant"
    role: NodeRole = "source"
    config_model = ConstantConfig

    async def execute(self, ctx: NodeContext[ConstantConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=ctx.config.value)


class AgentExecutor:
    """Agent node that calls an LLM provider (OpenAI or Anthropic)."""

    type = "agent"
    role: NodeRole = "agent"
    config_model = AgentConfig

    def validate(self, config: AgentConfig) -> None:
        if not config.model:
            raise ValueError("Model must not be empty.")
        if config.temperature < 0.0 or config.temperature > 1.0:
            raise ValueError("Temperature must be between 0.0 and 1.0.")

    async def execute(self, ctx: NodeContext[AgentConfig]) -> AsyncIterator[NodeEvent]:
        # Formulate messages from inputs
        messages = []
        if not ctx.inputs:
            messages.append(ProviderMessage(role="user", content="Execute step."))
        else:
            for node_id, value in ctx.inputs.items():
                messages.append(
                    ProviderMessage(role="user", content=f"Inputs from {node_id}:\n{value}")
                )

        # Select provider
        if ctx.config.provider == "openai":
            provider: OpenAIProvider | AnthropicProvider = OpenAIProvider()
        elif ctx.config.provider == "anthropic":
            provider = AnthropicProvider()
        else:
            raise ValueError(f"Unknown provider: {ctx.config.provider}")

        # Estimate prompt tokens based on inputs and system prompt
        prompt_text = (ctx.config.system_prompt or "") + "".join(str(m.content) for m in messages)
        tokens_in = max(1, len(prompt_text) // 4)

        # Stream response
        accumulated_text = ""
        async for chunk in provider.stream_response(
            model=ctx.config.model,
            messages=messages,
            system_prompt=ctx.config.system_prompt,
            temperature=ctx.config.temperature,
            max_tokens=ctx.config.max_tokens,
        ):
            accumulated_text += chunk
            yield TokenChunk(text=chunk)

        tokens_out = max(1, len(accumulated_text) // 4)
        cost_cents = round((tokens_in * 0.0002) + (tokens_out * 0.0010))
        if cost_cents == 0 and (tokens_in > 0 or tokens_out > 0):
            cost_cents = 1

        yield NodeOutput(
            value=accumulated_text,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_cents=cost_cents,
        )


class ToolExecutor:
    """Tool node that executes a utility capability: search, HTTP request, or sandboxed code."""

    type = "tool"
    role: NodeRole = "tool"
    config_model = ToolConfig

    def validate(self, config: ToolConfig) -> None:
        if config.tool_type == "http":
            if not config.http_url:
                raise ValueError("HTTP URL must be configured for HTTP tool.")
        elif config.tool_type == "search":
            if not config.search_query_template:
                raise ValueError("Search query template must be configured for search tool.")
        elif config.tool_type == "code":
            if not config.code_source:
                raise ValueError("Code source must be configured for code tool.")

    async def execute(self, ctx: NodeContext[ToolConfig]) -> AsyncIterator[NodeEvent]:
        config = ctx.config

        # Helper to resolve templates using inputs (e.g. replacing {input} or node outputs)
        def resolve_template(template: str | None) -> str:
            if not template:
                return ""
            resolved = template
            for node_id, value in ctx.inputs.items():
                placeholder = f"{{{node_id}}}"
                if placeholder in resolved:
                    resolved = resolved.replace(placeholder, str(value))
                if "{input}" in resolved:
                    resolved = resolved.replace("{input}", str(value))
            return resolved

        if config.tool_type == "search":
            query = resolve_template(config.search_query_template)
            yield TokenChunk(text=f"Searching for: '{query}'...\n")
            results = (
                f"Mock Search Results for '{query}':\n"
                f"- Result 1: Information about {query}\n"
                f"- Result 2: More data relating to {query}"
            )
            yield TokenChunk(text=results)
            yield NodeOutput(value=results)

        elif config.tool_type == "http":
            url = resolve_template(config.http_url)
            method = config.http_method
            headers = config.http_headers or {}
            body = resolve_template(config.http_body_template)

            yield TokenChunk(text=f"Sending {method} request to {url}...\n")
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    content=body if body else None,
                )
                response_text = response.text
                yield TokenChunk(text=f"HTTP {response.status_code} received.\n")
                yield NodeOutput(value=response_text)

        elif config.tool_type == "code":
            code = config.code_source or ""
            yield TokenChunk(text="Running sandboxed execution...\n")

            # Execute sandboxed python code
            safe_builtins = {
                "abs": abs,
                "all": all,
                "any": any,
                "dict": dict,
                "float": float,
                "int": int,
                "len": len,
                "list": list,
                "map": map,
                "max": max,
                "min": min,
                "range": range,
                "round": round,
                "set": set,
                "str": str,
                "sum": sum,
                "tuple": tuple,
            }
            local_scope: dict[str, Any] = {"inputs": ctx.inputs, "output": None}
            try:
                exec(code, {"__builtins__": safe_builtins}, local_scope)
                result = local_scope.get("output")
                yield TokenChunk(text=f"Code output: {result}\n")
                yield NodeOutput(value=result)
            except Exception as e:
                raise RuntimeError(f"Sandboxed code execution failed: {e}") from e


class RouterExecutor:
    """Router node that directs control flow dynamically in the DAG."""

    type = "router"
    role: NodeRole = "router"
    config_model = RouterConfig

    def validate(self, config: RouterConfig) -> None:
        if not config.expression:
            raise ValueError("Expression must be configured for router tool.")

    async def execute(self, ctx: NodeContext[RouterConfig]) -> AsyncIterator[NodeEvent]:
        config = ctx.config
        yield TokenChunk(text=f"Evaluating routing expression: {config.expression}...\n")

        # Execute sandboxed python expression
        safe_builtins = {
            "abs": abs,
            "all": all,
            "any": any,
            "dict": dict,
            "float": float,
            "int": int,
            "len": len,
            "list": list,
            "map": map,
            "max": max,
            "min": min,
            "range": range,
            "round": round,
            "set": set,
            "str": str,
            "sum": sum,
            "tuple": tuple,
        }
        local_scope: dict[str, Any] = {"inputs": ctx.inputs, "result": None}
        try:
            # We wrap the expression to assign it to result
            exec(f"result = {config.expression}", {"__builtins__": safe_builtins}, local_scope)
            val = str(local_scope.get("result"))
            target = config.routes.get(val, config.default_route)
            yield TokenChunk(text=f"Expression evaluated to: '{val}'. Routed to: {target}\n")
            yield NodeOutput(value={"selected_route": target})
        except Exception as e:
            raise RuntimeError(f"Router expression evaluation failed: {e}") from e
