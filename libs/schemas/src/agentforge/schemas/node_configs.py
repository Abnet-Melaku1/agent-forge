from typing import Literal

from pydantic import BaseModel, JsonValue


class ConstantConfig(BaseModel):
    """Config for a `constant` source node: emits a fixed value."""

    value: JsonValue


class AgentConfig(BaseModel):
    """Config for an `agent` node: executes an LLM prompt/query."""

    provider: Literal["openai", "anthropic"]
    model: str
    system_prompt: str | None = None
    temperature: float = 0.7
    max_tokens: int | None = None


class ToolConfig(BaseModel):
    """Config for a `tool` node: executes an HTTP call, search, or sandboxed code."""

    tool_type: Literal["search", "http", "code"]
    search_query_template: str | None = None
    http_url: str | None = None
    http_method: Literal["GET", "POST", "PUT", "DELETE"] = "GET"
    http_headers: dict[str, str] | None = None
    http_body_template: str | None = None
    code_source: str | None = None


class RouterConfig(BaseModel):
    """Config for a `router` node: routes control flow to specific branch(es)."""

    expression: str
    routes: dict[str, str]
    default_route: str | None = None
