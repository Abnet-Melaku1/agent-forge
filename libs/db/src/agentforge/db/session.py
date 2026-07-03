from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def create_engine(url: str) -> AsyncEngine:
    """Create an async engine for the given database URL."""
    return create_async_engine(url)


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Build a session factory bound to an engine (inject it; no globals)."""
    return async_sessionmaker(engine, expire_on_commit=False)
