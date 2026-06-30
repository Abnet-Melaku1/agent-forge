from agentforge.engine.context import NodeContext
from agentforge.engine.executors import ConstantExecutor
from agentforge.schemas import ConstantConfig, NodeOutput


async def test_constant_executor_emits_its_configured_value() -> None:
    # A constant node yields one output event carrying its configured value.
    executor = ConstantExecutor()
    ctx = NodeContext(node_id="c1", config=ConstantConfig(value={"x": 1}))
    events = [event async for event in executor.execute(ctx)]
    assert events == [NodeOutput(value={"x": 1})]


def test_constant_executor_is_identified_as_a_source() -> None:
    # The constant executor declares itself a source-role "constant" node type.
    executor = ConstantExecutor()
    assert executor.type == "constant"
    assert executor.role == "source"
    assert executor.config_model is ConstantConfig
