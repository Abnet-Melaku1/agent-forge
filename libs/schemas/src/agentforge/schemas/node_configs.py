from pydantic import BaseModel, JsonValue


class ConstantConfig(BaseModel):
    """Config for a `constant` source node: emits a fixed value."""

    value: JsonValue
