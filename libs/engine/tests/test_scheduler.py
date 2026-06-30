import pytest
from agentforge.engine.scheduler import GraphCycleError, UnknownNodeError, topological_order
from agentforge.schemas import Edge, Graph, Node


def _node(node_id: str) -> Node:
    return Node(id=node_id, type="noop", role="tool")


def _graph(node_ids: list[str], edges: list[tuple[str, str]]) -> Graph:
    return Graph(
        nodes=[_node(n) for n in node_ids],
        edges=[Edge(source=s, target=t) for s, t in edges],
    )


def _order_index(order: list[str]) -> dict[str, int]:
    return {node_id: i for i, node_id in enumerate(order)}


def test_linear_chain_preserves_order() -> None:
    # A linear dependency chain yields nodes in strict upstream-to-downstream order.
    graph = _graph(["a", "b", "c"], [("a", "b"), ("b", "c")])
    assert topological_order(graph) == ["a", "b", "c"]


def test_diamond_places_dependencies_before_dependents() -> None:
    # A diamond graph orders every node after all of its upstream dependencies.
    graph = _graph(["a", "b", "c", "d"], [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")])

    order = topological_order(graph)
    idx = _order_index(order)

    assert set(order) == {"a", "b", "c", "d"}
    assert idx["a"] < idx["b"] < idx["d"]
    assert idx["a"] < idx["c"] < idx["d"]


def test_cycle_is_rejected() -> None:
    # A graph containing a cycle is not a DAG and raises GraphCycleError.
    graph = _graph(["a", "b"], [("a", "b"), ("b", "a")])
    with pytest.raises(GraphCycleError):
        topological_order(graph)


def test_edge_to_unknown_node_is_rejected() -> None:
    # An edge pointing at a non-existent node id raises UnknownNodeError.
    graph = _graph(["a"], [("a", "ghost")])
    with pytest.raises(UnknownNodeError):
        topological_order(graph)
