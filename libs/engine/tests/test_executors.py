from unittest.mock import patch

import pytest
from agentforge.engine.context import NodeContext
from agentforge.engine.executors import AgentExecutor, ConstantExecutor, ToolExecutor
from agentforge.schemas import AgentConfig, ConstantConfig, NodeOutput, TokenChunk, ToolConfig


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


def test_agent_executor_validation() -> None:
    executor = AgentExecutor()
    # Valid config passes validation
    executor.validate(AgentConfig(provider="openai", model="gpt-4", temperature=0.5))

    # Invalid temperature raises
    with pytest.raises(ValueError, match=r"Temperature must be between 0\.0 and 1\.0"):
        executor.validate(AgentConfig(provider="openai", model="gpt-4", temperature=1.5))

    # Invalid model raises
    with pytest.raises(ValueError, match=r"Model must not be empty\."):
        executor.validate(AgentConfig(provider="openai", model="", temperature=0.7))


async def test_agent_executor_streams_and_completes() -> None:
    executor = AgentExecutor()
    ctx = NodeContext(
        node_id="a1",
        config=AgentConfig(provider="openai", model="gpt-4o", temperature=0.7),
        inputs={"USER_QUERY": "Hello"},
    )

    mock_chunks = ["Hello", " world", "!"]

    async def mock_stream(*args, **kwargs):  # type: ignore[no-untyped-def]
        for chunk in mock_chunks:
            yield chunk

    with patch("agentforge.engine.executors.OpenAIProvider") as mock_provider_class:
        mock_provider = mock_provider_class.return_value
        mock_provider.stream_response = mock_stream

        events = [event async for event in executor.execute(ctx)]

        assert events == [
            TokenChunk(text="Hello"),
            TokenChunk(text=" world"),
            TokenChunk(text="!"),
            NodeOutput(
                value="Hello world!",
                tokens_in=7,
                tokens_out=3,
                cost_cents=1,
            ),
        ]


async def test_tool_executor_search() -> None:
    executor = ToolExecutor()
    ctx = NodeContext(
        node_id="t1",
        config=ToolConfig(tool_type="search", search_query_template="query {input}"),
        inputs={"USER_QUERY": "test"},
    )
    events = [event async for event in executor.execute(ctx)]
    assert any(isinstance(e, TokenChunk) and "test" in e.text for e in events)
    assert any(
        isinstance(e, NodeOutput) and isinstance(e.value, str) and "test" in e.value for e in events
    )


async def test_tool_executor_http() -> None:
    executor = ToolExecutor()
    ctx = NodeContext(
        node_id="t2",
        config=ToolConfig(
            tool_type="http", http_url="http://example.com/{input}", http_method="GET"
        ),
        inputs={"USER_QUERY": "api"},
    )

    class MockResponse:
        status_code = 200
        text = "mock-http-body"

    async def mock_request(*args, **kwargs):  # type: ignore[no-untyped-def]
        return MockResponse()

    with patch("httpx.AsyncClient.request", side_effect=mock_request):
        events = [event async for event in executor.execute(ctx)]
        assert any(isinstance(e, TokenChunk) and "200" in e.text for e in events)
        assert any(isinstance(e, NodeOutput) and e.value == "mock-http-body" for e in events)


async def test_tool_executor_code_success() -> None:
    executor = ToolExecutor()
    ctx = NodeContext(
        node_id="t3",
        config=ToolConfig(tool_type="code", code_source="output = inputs.get('USER_QUERY') * 2"),
        inputs={"USER_QUERY": 5},
    )
    events = [event async for event in executor.execute(ctx)]
    assert any(isinstance(e, NodeOutput) and e.value == 10 for e in events)


async def test_tool_executor_code_sandbox_violation() -> None:
    executor = ToolExecutor()
    ctx = NodeContext(
        node_id="t4",
        config=ToolConfig(tool_type="code", code_source="import os\noutput = 1"),
        inputs={},
    )
    with pytest.raises(Exception, match="Sandboxed code execution failed"):
        [event async for event in executor.execute(ctx)]
