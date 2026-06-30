from collections import deque

from agentforge.schemas import Graph


class GraphError(Exception):
    """Base class for graph compilation errors."""


class UnknownNodeError(GraphError):
    """An edge references a node id that is not in the graph."""


class GraphCycleError(GraphError):
    """The graph contains a cycle and is therefore not a DAG."""


def topological_order(graph: Graph) -> list[str]:
    """Return node ids in a valid execution order (Kahn's algorithm).

    Raises UnknownNodeError if an edge references an unknown node, and
    GraphCycleError if the graph is not a DAG.
    """
    node_ids = {node.id for node in graph.nodes}

    in_degree = {node_id: 0 for node_id in node_ids}
    successors: dict[str, list[str]] = {node_id: [] for node_id in node_ids}

    for edge in graph.edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            raise UnknownNodeError(
                f"edge {edge.source!r} -> {edge.target!r} references an unknown node"
            )
        successors[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    # Start from nodes with no dependencies; sorted keeps the order deterministic.
    ready = deque(sorted(node_id for node_id, degree in in_degree.items() if degree == 0))
    order: list[str] = []

    while ready:
        node_id = ready.popleft()
        order.append(node_id)
        for successor in successors[node_id]:
            in_degree[successor] -= 1
            if in_degree[successor] == 0:
                ready.append(successor)

    # Nodes that never reached in-degree 0 are trapped in a cycle.
    if len(order) != len(node_ids):
        raise GraphCycleError("graph contains a cycle; expected a DAG")

    return order
