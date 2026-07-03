from dataclasses import dataclass

from agentforge.schemas import NodeStatus, RunStatus
from pydantic import JsonValue


@dataclass(frozen=True)
class NodeResult:
    node_id: str
    status: NodeStatus
    output: JsonValue = None
    error: str | None = None


@dataclass(frozen=True)
class RunResult:
    status: RunStatus
    nodes: dict[str, NodeResult]
