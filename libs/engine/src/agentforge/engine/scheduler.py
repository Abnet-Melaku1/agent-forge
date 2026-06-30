from collections import deque

from agentforge.schemas import Graph


class GraphError(Exception):
    """Base class for graph compilation errors."""


class UnknownNodeError(GraphError):
    """An edge references a node id that is not in the graph."""


class GraphCycleError(GraphError):
    """The graph contains a cycle and is therefore not a DAG."""


class NodeAlreadyCompletedError(GraphError):
    """A node was marked complete more than once in the same run."""


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


class RunScheduler:
    """Tracks execution readiness for a single run as nodes complete.

    Construction validates the graph is a DAG. `start` yields the initial
    runnable nodes; `mark_complete` propagates completion and yields any
    nodes that become runnable as a result.
    """

    def __init__(self, graph: Graph) -> None:
        topological_order(graph)  # reject cycles and unknown-node edges up front

        self._successors: dict[str, list[str]] = {node.id: [] for node in graph.nodes}
        self._pending_upstream: dict[str, int] = {node.id: 0 for node in graph.nodes}
        for edge in graph.edges:
            self._successors[edge.source].append(edge.target)
            self._pending_upstream[edge.target] += 1

        self._completed: set[str] = set()

    def start(self) -> list[str]:
        """Return the in-degree-0 nodes that can run immediately."""
        return sorted(
            node_id for node_id, pending in self._pending_upstream.items() if pending == 0
        )

    def mark_complete(self, node_id: str) -> list[str]:
        """Record a node as finished and return the nodes it unblocks."""
        if node_id not in self._pending_upstream:
            raise UnknownNodeError(f"node {node_id!r} is not in the graph")
        if node_id in self._completed:
            raise NodeAlreadyCompletedError(f"node {node_id!r} was already completed")

        self._completed.add(node_id)

        newly_ready: list[str] = []
        for successor in self._successors[node_id]:
            self._pending_upstream[successor] -= 1
            if self._pending_upstream[successor] == 0:
                newly_ready.append(successor)

        return sorted(newly_ready)

    @property
    def is_done(self) -> bool:
        """True once every node in the graph has completed."""
        return len(self._completed) == len(self._pending_upstream)
