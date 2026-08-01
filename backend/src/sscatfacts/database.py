from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import MetaData, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+psycopg://sscatfacts:sscatfacts@postgres:5432/sscatfacts"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


settings = Settings()
engine: AsyncEngine = create_async_engine(settings.database_url, pool_pre_ping=True)


async def database_is_ready() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return False
    return True
