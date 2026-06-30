import builtins
from typing import Protocol, TypeVar, runtime_checkable

from agentforge.schemas import NodeRole
from pydantic import BaseModel

C_co = TypeVar("C_co", bound=BaseModel, covariant=True)


@runtime_checkable
class NodeExecutor(Protocol[C_co]):
    """A registered handler for a single node type, parameterized by its config.

    `execute` (the async event-yielding runner) is added in the execution
    slice; the registry only needs the identity and config attributes.
    """

    @property
    def type(self) -> str: ...

    @property
    def role(self) -> NodeRole: ...

    @property
    def config_model(self) -> builtins.type[C_co]: ...
