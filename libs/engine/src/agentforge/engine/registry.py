from typing import Any

from agentforge.engine.executor import NodeExecutor

# Executors differ in their config type, so the registry is heterogeneous.
AnyExecutor = NodeExecutor[Any]


class RegistryError(Exception):
    """Base class for node registry errors."""


class UnknownNodeTypeError(RegistryError):
    """No executor is registered for the requested node type."""


class DuplicateNodeTypeError(RegistryError):
    """An executor is already registered for this node type."""


class NodeRegistry:
    """Maps canonical node type ids to their executors.

    Lookups fail closed: an unregistered type raises rather than returning a
    default, so unknown node types can never execute.
    """

    def __init__(self) -> None:
        self._executors: dict[str, AnyExecutor] = {}

    def register(self, executor: AnyExecutor) -> None:
        if executor.type in self._executors:
            raise DuplicateNodeTypeError(f"node type {executor.type!r} is already registered")
        self._executors[executor.type] = executor

    def get(self, node_type: str) -> AnyExecutor:
        try:
            return self._executors[node_type]
        except KeyError:
            raise UnknownNodeTypeError(
                f"no executor registered for node type {node_type!r}"
            ) from None

    def __contains__(self, node_type: object) -> bool:
        return node_type in self._executors

    def types(self) -> list[str]:
        return sorted(self._executors)


def build_default_registry() -> NodeRegistry:
    """Return a registry populated with the built-in node executors."""
    from agentforge.engine.executors import (
        AgentExecutor,
        ConstantExecutor,
        RouterExecutor,
        ToolExecutor,
    )

    registry = NodeRegistry()
    registry.register(ConstantExecutor())
    registry.register(AgentExecutor())
    registry.register(ToolExecutor())
    registry.register(RouterExecutor())
    return registry
