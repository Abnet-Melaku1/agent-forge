from collections.abc import AsyncIterator

import pytest
from agentforge.engine.context import NodeContext
from agentforge.engine.registry import (
    DuplicateNodeTypeError,
    NodeRegistry,
    UnknownNodeTypeError,
)
from agentforge.schemas import NodeEvent, NodeOutput, NodeRole
from pydantic import BaseModel


class _NoopConfig(BaseModel):
    pass


class _NoopExecutor:
    type = "noop"
    role: NodeRole = "tool"
    config_model = _NoopConfig

    async def execute(self, ctx: NodeContext[_NoopConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=None)


def test_registered_executor_can_be_retrieved_by_type() -> None:
    # An executor registered under its type is returned by get().
    registry = NodeRegistry()
    executor = _NoopExecutor()
    registry.register(executor)
    assert registry.get("noop") is executor


def test_unknown_type_fails_closed() -> None:
    # Looking up an unregistered type raises rather than returning a default.
    registry = NodeRegistry()
    with pytest.raises(UnknownNodeTypeError):
        registry.get("noop")


def test_registering_a_duplicate_type_is_rejected() -> None:
    # Two executors claiming the same type is a configuration bug and raises.
    registry = NodeRegistry()
    registry.register(_NoopExecutor())
    with pytest.raises(DuplicateNodeTypeError):
        registry.register(_NoopExecutor())


def test_contains_reports_registration_state() -> None:
    # Membership reflects whether a type has been registered.
    registry = NodeRegistry()
    assert "noop" not in registry
    registry.register(_NoopExecutor())
    assert "noop" in registry
