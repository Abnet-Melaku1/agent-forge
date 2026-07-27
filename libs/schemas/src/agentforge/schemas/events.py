from typing import Literal

from pydantic import BaseModel, JsonValue


class TokenChunk(BaseModel):
    """A streamed fragment of a node's textual output."""

    kind: Literal["token"] = "token"
    text: str


class NodeOutput(BaseModel):
    """A node's resolved output value."""

    kind: Literal["output"] = "output"
    value: JsonValue
    tokens_in: int = 0
    tokens_out: int = 0
    cost_cents: int = 0


NodeEvent = TokenChunk | NodeOutput
