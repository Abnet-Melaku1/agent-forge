import pytest
from agentforge.engine.scheduler import (
    NodeAlreadyCompletedError,
    RunScheduler,
    UnknownNodeError,
)
from agentforge.schemas import Edge, Graph, Node


def _node(node_id: str) -> Node:
    return Node(id=node_id, type="noop", role="tool")


def _graph(node_ids: list[str], edges: list[tuple[str, str]]) -> Graph:
    return Graph(
        nodes=[_node(n) for n in node_ids],
        edges=[Edge(source=s, target=t) for s, t in edges],
    )


def test_start_returns_nodes_with_no_dependencies() -> None:
    # A fresh run is ready to execute exactly the in-degree-0 nodes.
    scheduler = RunScheduler(_graph(["a", "b", "c"], [("a", "b"), ("b", "c")]))
    assert scheduler.start() == ["a"]


def test_completing_a_node_releases_its_direct_dependent() -> None:
    # Finishing an upstream node makes its sole downstream node runnable.
    scheduler = RunScheduler(_graph(["a", "b"], [("a", "b")]))
    scheduler.start()
    assert scheduler.mark_complete("a") == ["b"]


def test_dependent_waits_for_all_upstream_nodes() -> None:
    # In a diamond, the join node runs only after both branches complete.
    scheduler = RunScheduler(
        _graph(["a", "b", "c", "d"], [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")])
    )
    scheduler.start()
    assert scheduler.mark_complete("a") == ["b", "c"]
    assert scheduler.mark_complete("b") == []
    assert scheduler.mark_complete("c") == ["d"]


def test_run_is_done_only_after_every_node_completes() -> None:
    # is_done flips true exactly when the last node is marked complete.
    scheduler = RunScheduler(_graph(["a", "b"], [("a", "b")]))
    scheduler.start()
    assert scheduler.is_done is False
    scheduler.mark_complete("a")
    assert scheduler.is_done is False
    scheduler.mark_complete("b")
    assert scheduler.is_done is True


def test_completing_unknown_node_is_rejected() -> None:
    # Marking a node id that is not in the graph raises UnknownNodeError.
    scheduler = RunScheduler(_graph(["a"], []))
    with pytest.raises(UnknownNodeError):
        scheduler.mark_complete("ghost")


def test_completing_the_same_node_twice_is_rejected() -> None:
    # A node may only be completed once; a repeat raises NodeAlreadyCompletedError.
    scheduler = RunScheduler(_graph(["a", "b"], [("a", "b")]))
    scheduler.start()
    scheduler.mark_complete("a")
    with pytest.raises(NodeAlreadyCompletedError):
        scheduler.mark_complete("a")
