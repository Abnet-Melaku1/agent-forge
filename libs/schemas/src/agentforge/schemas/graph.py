from typing import Literal

from pydantic import BaseModel, Field, JsonValue

NodeRole = Literal["source", "agent", "tool", "router", "output"]


class Node(BaseModel):
    id: str
    type: str
    role: NodeRole
    config: dict[str, JsonValue] = Field(default_factory=dict)


class Edge(BaseModel):
    source: str
    target: str


class Graph(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
