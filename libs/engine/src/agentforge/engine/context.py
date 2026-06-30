from collections.abc import Mapping
from dataclasses import dataclass, field

from pydantic import BaseModel, JsonValue


@dataclass(frozen=True)
class NodeContext[C: BaseModel]:
    """Everything a node executor needs to run one node.

    `inputs` maps each upstream node id to the output it produced.
    """

    node_id: str
    config: C
    inputs: Mapping[str, JsonValue] = field(default_factory=dict)
