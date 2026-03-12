"""
Extract layer reads source data in configurable batches.

Supports:
  • Full extraction (first run or reset)
  • Incremental extraction via high-water-mark timestamps
  • Batch iteration so memory stays bounded for large tables
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Iterator

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Connection

from config import pipeline_config

logger = logging.getLogger("etl.extract")

# Watermark helpers — track the last-processed timestamp per source table
# ---------------------------------------------------------------------------

_WATERMARK_DDL = f"""
CREATE TABLE IF NOT EXISTS {pipeline_config.table_watermarks} (
    source_table VARCHAR(128) PRIMARY KEY,
    last_extracted_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
"""


def ensure_watermark_table(conn: Connection) -> None:
    """Create the watermark tracking table if it does not exist."""
    conn.execute(text(_WATERMARK_DDL))
    conn.commit()


def get_watermark(conn: Connection, source_table: str) -> datetime | None:
    """Return the high-water-mark for *source_table*, or None if never run."""
    row = conn.execute(
        text(
            f"SELECT last_extracted_at FROM {pipeline_config.table_watermarks} "
            "WHERE source_table = :t"
        ),
        {"t": source_table},
    ).fetchone()
    return row[0] if row else None


def set_watermark(conn: Connection, source_table: str, ts: datetime) -> None:
    """Upsert the high-water-mark for *source_table*."""
    conn.execute(
        text(
            f"INSERT INTO {pipeline_config.table_watermarks} "
            "(source_table, last_extracted_at, updated_at) "
            "VALUES (:t, :ts, CURRENT_TIMESTAMP) "
            "ON CONFLICT (source_table) DO UPDATE "
            "SET last_extracted_at = EXCLUDED.last_extracted_at, "
            "    updated_at = CURRENT_TIMESTAMP"
        ),
        {"t": source_table, "ts": ts},
    )
    conn.commit()


# Batched extraction generators
# ---------------------------------------------------------------------------

def _batched_query(conn: Connection, query: str,
    params: dict | None = None,
    batch_size: int | None = None,
) -> Iterator[pd.DataFrame]:
    """Execute *query* and yield DataFrames of *batch_size* rows."""
    size = batch_size or pipeline_config.extract_batch_size
    result = conn.execute(text(query), params or {})
    columns = list(result.keys())

    while True:
        rows = result.fetchmany(size)
        if not rows:
            break
        yield pd.DataFrame(rows, columns=columns)


# Public extract functions
# ---------------------------------------------------------------------------

def extract_posts(conn: Connection, since: datetime | None = None,
) -> Iterator[pd.DataFrame]:
    """Yield batches of posts joined with author + category info.

    If *since* is provided only posts created/updated after that timestamp
    are returned (incremental mode).
    """
    base = """
        SELECT p.id, p.title, p.content, p.created_at, p.updated_at,
               p.is_deleted,
               u.id   AS author_id,
               u.name AS author_name,
               u.email AS author_email,
               c.id   AS category_id,
               c.name AS category_name
        FROM posts p
        JOIN users u  ON p.author_id  = u.id
        LEFT JOIN categories c ON p.category_id = c.id
    """
    if since:
        base += " WHERE p.created_at > :since OR p.updated_at > :since"
        base += " ORDER BY p.created_at"
        params = {"since": since}
    else:
        base += " ORDER BY p.created_at"
        params = {}

    logger.info(
        "Extracting posts%s …",
        f" since {since:%Y-%m-%d %H:%M}" if since else " (full)",
    )
    yield from _batched_query(conn, base, params)


def extract_comments( conn: Connection,since: datetime | None = None) -> Iterator[pd.DataFrame]:
    """Yield batches of comments joined with author info."""
    base = """
        SELECT c.id, c.content, c.created_at, c.is_deleted,
               c.post_id,
               u.id   AS author_id,
               u.name AS author_name,
               u.email AS author_email
        FROM comments c
        JOIN users u ON c.author_id = u.id
    """
    if since:
        base += " WHERE c.created_at > :since"
        base += " ORDER BY c.created_at"
        params = {"since": since}
    else:
        base += " ORDER BY c.created_at"
        params = {}

    logger.info(
        "Extracting comments%s …",
        f" since {since:%Y-%m-%d %H:%M}" if since else " (full)",
    )
    yield from _batched_query(conn, base, params)


def extract_users(conn: Connection) -> pd.DataFrame:
    """Extract the full users table (lightweight — needed for engagement)."""
    logger.info("Extracting users …")
    return pd.read_sql(
        text(
            "SELECT id, name, email, role, created_at, is_active FROM users ORDER BY id"
        ),
        conn,
    )
