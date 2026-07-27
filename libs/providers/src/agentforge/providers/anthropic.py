import os
from collections.abc import AsyncIterator
from typing import Any

from agentforge.providers.base import ProviderMessage
from anthropic import AsyncAnthropic


class AnthropicProvider:
    """LLM provider wrapper for Anthropic's API."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self._client: AsyncAnthropic | None = None

    def _get_client(self) -> AsyncAnthropic:
        if self._client is None:
            if not self._api_key:
                raise ValueError("ANTHROPIC_API_KEY is not set.")
            self._client = AsyncAnthropic(api_key=self._api_key)
        return self._client

    async def generate_response(
        self,
        model: str,
        messages: list[ProviderMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> str:
        client = self._get_client()
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        kwargs: dict[str, Any] = {}
        if system_prompt:
            kwargs["system"] = system_prompt
        actual_max_tokens = max_tokens or 4096

        response = await client.messages.create(
            model=model,
            messages=formatted_messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=actual_max_tokens,
            **kwargs,
        )
        if response.content:
            return str(response.content[0].text)  # type: ignore[union-attr]
        return ""

    async def stream_response(
        self,
        model: str,
        messages: list[ProviderMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        kwargs: dict[str, Any] = {}
        if system_prompt:
            kwargs["system"] = system_prompt
        actual_max_tokens = max_tokens or 4096

        async with client.messages.stream(
            model=model,
            messages=formatted_messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=actual_max_tokens,
            **kwargs,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    yield event.delta.text
