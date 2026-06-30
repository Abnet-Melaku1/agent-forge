import builtins
from collections.abc import AsyncIterator
from typing import Protocol, TypeVar, runtime_checkable

from agentforge.engine.context import NodeContext
from agentforge.schemas import NodeEvent, NodeRole
from pydantic import BaseModel

C = TypeVar("C", bound=BaseModel)


@runtime_checkable
class NodeExecutor(Protocol[C]):
    """A registered handler for a single node type, parameterized by its config."""

    @property
    def type(self) -> str: ...

    @property
    def role(self) -> NodeRole: ...

    @property
    def config_model(self) -> builtins.type[C]: ...

    def execute(self, ctx: NodeContext[C]) -> AsyncIterator[NodeEvent]:
        """Run the node, yielding events as they happen."""
        ...
