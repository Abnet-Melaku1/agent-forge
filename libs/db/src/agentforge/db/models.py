from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from agentforge.db.base import Base
from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column


class Workflow(Base):
    __tablename__ = "workflow"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255))
    draft: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WorkflowVersion(Base):
    __tablename__ = "workflow_version"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    workflow_id: Mapped[UUID] = mapped_column(ForeignKey("workflow.id"))
    version: Mapped[int] = mapped_column(Integer)
    graph: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Run(Base):
    __tablename__ = "run"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    workflow_version_id: Mapped[UUID] = mapped_column(ForeignKey("workflow_version.id"))
    status: Mapped[str] = mapped_column(String(32))
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)


class NodeExecution(Base):
    __tablename__ = "node_execution"
    __table_args__ = (
        # Idempotency key: one row per (run, node, attempt) — retries never double-write.
        UniqueConstraint("run_id", "node_id", "attempt", name="uq_node_execution_attempt"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    run_id: Mapped[UUID] = mapped_column(ForeignKey("run.id"))
    node_id: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32))
    input: Mapped[Any | None] = mapped_column(JSON, default=None)
    output: Mapped[Any | None] = mapped_column(JSON, default=None)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    logs: Mapped[Any | None] = mapped_column(JSON, default=None)
    error: Mapped[str | None] = mapped_column(String, default=None)
    attempt: Mapped[int] = mapped_column(Integer, default=1)
