from dataclasses import dataclass
from typing import Literal

from pydantic import JsonValue

NodeStatus = Literal["succeeded", "failed", "skipped"]
RunStatus = Literal["succeeded", "failed"]


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
