import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db.database import create_engine_for_url


def test_sqlite_engine_enables_foreign_key_constraints():
    engine = create_engine_for_url("sqlite://")
    try:
        with engine.begin() as connection:
            connection.execute(text("CREATE TABLE parent (id INTEGER PRIMARY KEY)"))
            connection.execute(
                text(
                    "CREATE TABLE child (id INTEGER PRIMARY KEY, "
                    "parent_id INTEGER REFERENCES parent(id) ON DELETE CASCADE)"
                )
            )
            with pytest.raises(IntegrityError):
                connection.execute(
                    text("INSERT INTO child (id, parent_id) VALUES (1, 999)")
                )
    finally:
        engine.dispose()


def test_sqlite_engine_applies_database_level_cascades():
    engine = create_engine_for_url("sqlite://")
    try:
        with engine.begin() as connection:
            connection.execute(text("CREATE TABLE parent (id INTEGER PRIMARY KEY)"))
            connection.execute(
                text(
                    "CREATE TABLE child (id INTEGER PRIMARY KEY, "
                    "parent_id INTEGER REFERENCES parent(id) ON DELETE CASCADE)"
                )
            )
            connection.execute(text("INSERT INTO parent (id) VALUES (1)"))
            connection.execute(text("INSERT INTO child (id, parent_id) VALUES (1, 1)"))
            connection.execute(text("DELETE FROM parent WHERE id = 1"))
            assert connection.scalar(text("SELECT COUNT(*) FROM child")) == 0
    finally:
        engine.dispose()


def test_legacy_postgres_url_uses_postgresql_driver_name():
    engine = create_engine_for_url("postgres://user:password@localhost/database")
    try:
        assert engine.url.drivername == "postgresql+psycopg2"
        assert engine.url.password == "password"
    finally:
        engine.dispose()
