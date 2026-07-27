from collections.abc import AsyncIterator
from typing import Protocol

from pydantic import BaseModel


class ProviderMessage(BaseModel):
    role: str
    content: str


class LLMProvider(Protocol):
    """Protocol defining the interface for all LLM providers."""

    async def generate_response(
        self,
        model: str,
        messages: list[ProviderMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> str:
        """Generate a complete text response from the model."""
        ...

    async def stream_response(
        self,
        model: str,
        messages: list[ProviderMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        """Stream the text response chunks from the model."""
        ...
