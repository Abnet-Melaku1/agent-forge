from typing import Literal

from agentforge.schemas.run import NodeStatus, RunStatus
from pydantic import BaseModel, JsonValue


class RunStarted(BaseModel):
    kind: Literal["run_started"] = "run_started"


class NodeStarted(BaseModel):
    kind: Literal["node_started"] = "node_started"
    node_id: str


class NodeToken(BaseModel):
    kind: Literal["node_token"] = "node_token"
    node_id: str
    text: str


class NodeFinished(BaseModel):
    kind: Literal["node_finished"] = "node_finished"
    node_id: str
    status: NodeStatus
    output: JsonValue = None
    error: str | None = None


class RunFinished(BaseModel):
    kind: Literal["run_finished"] = "run_finished"
    status: RunStatus


RunEvent = RunStarted | NodeStarted | NodeToken | NodeFinished | RunFinished
