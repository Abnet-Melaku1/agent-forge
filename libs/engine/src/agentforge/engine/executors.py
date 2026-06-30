from collections.abc import AsyncIterator

from agentforge.engine.context import NodeContext
from agentforge.schemas import ConstantConfig, NodeEvent, NodeOutput, NodeRole


class ConstantExecutor:
    """Source node that emits a fixed, configured value."""

    type = "constant"
    role: NodeRole = "source"
    config_model = ConstantConfig

    async def execute(self, ctx: NodeContext[ConstantConfig]) -> AsyncIterator[NodeEvent]:
        yield NodeOutput(value=ctx.config.value)
