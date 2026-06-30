from typing import Literal

from pydantic import BaseModel

NodeRole = Literal["source", "agent", "tool", "router", "output"]


class Node(BaseModel):
    id: str
    type: str
    role: NodeRole


class Edge(BaseModel):
    source: str
    target: str


class Graph(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
