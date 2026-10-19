import logging
from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


def create_engine_for_url(database_url: str):
    url = make_url(database_url)
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+psycopg2")

    is_sqlite = url.get_backend_name() == "sqlite"
    engine = create_engine(
        url,
        pool_pre_ping=True,
        echo=False,
        connect_args={"check_same_thread": False} if is_sqlite else {},
    )

    if is_sqlite:
        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


# Verify the configured database during startup so failures are not hidden.
db_url = settings.DATABASE_URL
try:
    engine = create_engine_for_url(db_url)
    with engine.connect():
        logger.info("Successfully connected to primary database.")
except Exception as error:
    safe_url = make_url(db_url).render_as_string(hide_password=True)
    logger.warning(
        "Failed to connect to primary database at %s (%s).",
        safe_url,
        type(error).__name__,
    )
    if settings.ALLOW_SQLITE_FALLBACK and settings.ENVIRONMENT == "development":
        logger.info("Falling back to local SQLite database for development / tests.")
        engine = create_engine_for_url("sqlite:///./retinasight_dev.db")
        with engine.connect():
            logger.info("Successfully connected to development fallback database.")
    else:
        raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
