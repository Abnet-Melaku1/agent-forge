import os
from collections.abc import AsyncIterator

from agentforge.providers.base import ProviderMessage
from openai import AsyncOpenAI


class OpenAIProvider:
    """LLM provider wrapper for OpenAI's API."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            if not self._api_key:
                raise ValueError("OPENAI_API_KEY is not set.")
            self._client = AsyncOpenAI(api_key=self._api_key)
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
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        response = await client.chat.completions.create(
            model=model,
            messages=formatted_messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

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
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        stream = await client.chat.completions.create(
            model=model,
            messages=formatted_messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:  # type: ignore[union-attr]
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
