from typing import Literal

from agentforge.schemas.node_configs import AgentConfig, ConstantConfig, RouterConfig, ToolConfig
from pydantic import BaseModel, Field, JsonValue

NodeRole = Literal["source", "agent", "tool", "router", "output"]


class Node(BaseModel):
    id: str
    type: str
    role: NodeRole
    config: ConstantConfig | AgentConfig | ToolConfig | RouterConfig | dict[str, JsonValue] = Field(
        default_factory=dict
    )
    timeout_seconds: float | None = None
    retry_attempts: int = 0
    retry_backoff_factor: float = 2.0


class Edge(BaseModel):
    source: str
    target: str


class Graph(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
