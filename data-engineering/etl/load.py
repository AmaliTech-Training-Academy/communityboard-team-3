"""
Load layer — upsert analytics DataFrames into PostgreSQL.

Features:
  • CREATE TABLE IF NOT EXISTS with indexes for fast queries
  • Upsert via INSERT … ON CONFLICT UPDATE (no data loss)
  • Batch writes with configurable chunk size
  • Atomic per-table loads wrapped in transactions
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Connection

from config import pipeline_config

logger = logging.getLogger("etl.load")

# Analytics DDL — tables + indexes
# ---------------------------------------------------------------------------

_ANALYTICS_DDL: dict[str, str] = {
    pipeline_config.table_daily_activity: """
        CREATE TABLE IF NOT EXISTS {table} (
            activity_date  DATE         NOT NULL,
            category_name  VARCHAR(128) NOT NULL,
            post_count     INTEGER      NOT NULL DEFAULT 0,
            comment_count  INTEGER      NOT NULL DEFAULT 0,
            PRIMARY KEY (activity_date, category_name)
        );
        CREATE INDEX IF NOT EXISTS idx_{table}_date
            ON {table} (activity_date DESC);
    """,
    pipeline_config.table_user_engagement: """
        CREATE TABLE IF NOT EXISTS {table} (
            user_hash         VARCHAR(16) PRIMARY KEY,
            posts_created     INTEGER   NOT NULL DEFAULT 0,
            comments_made     INTEGER   NOT NULL DEFAULT 0,
            engagement_score  INTEGER   NOT NULL DEFAULT 0,
            first_activity    TIMESTAMP,
            last_activity     TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_{table}_score
            ON {table} (engagement_score DESC);
    """,
    pipeline_config.table_category_trends: """
        CREATE TABLE IF NOT EXISTS {table} (
            trend_date       DATE         NOT NULL,
            category_name    VARCHAR(128) NOT NULL,
            posts_7d         INTEGER      NOT NULL DEFAULT 0,
            cumulative_posts INTEGER      NOT NULL DEFAULT 0,
            PRIMARY KEY (trend_date, category_name)
        );
        CREATE INDEX IF NOT EXISTS idx_{table}_date
            ON {table} (trend_date DESC);
    """,
    pipeline_config.table_content_stats: """
        CREATE TABLE IF NOT EXISTS {table} (
            category_name        VARCHAR(128) PRIMARY KEY,
            avg_post_length      REAL    NOT NULL DEFAULT 0,
            median_post_length   INTEGER NOT NULL DEFAULT 0,
            max_post_length      INTEGER NOT NULL DEFAULT 0,
            total_posts          INTEGER NOT NULL DEFAULT 0,
            total_comments       INTEGER NOT NULL DEFAULT 0,
            avg_comments_per_post REAL   NOT NULL DEFAULT 0
        );
    """,
    pipeline_config.table_top_contributors: """
        CREATE TABLE IF NOT EXISTS {table} (
            encrypted_name        TEXT    PRIMARY KEY,
            posts_created         INTEGER NOT NULL DEFAULT 0,
            comments_made         INTEGER NOT NULL DEFAULT 0,
            total_contributions   INTEGER NOT NULL DEFAULT 0,
            contribution_rank     INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_{table}_rank
            ON {table} (contribution_rank);
    """,
    pipeline_config.table_posts_by_category: """
        CREATE TABLE IF NOT EXISTS {table} (
            category_name  VARCHAR(128) PRIMARY KEY,
            active_posts   INTEGER NOT NULL DEFAULT 0,
            deleted_posts  INTEGER NOT NULL DEFAULT 0,
            total_posts    INTEGER NOT NULL DEFAULT 0,
            deletion_rate  REAL    NOT NULL DEFAULT 0
        );
    """,
    pipeline_config.table_weekly_report: """
        CREATE TABLE IF NOT EXISTS {table} (
            iso_year          INTEGER NOT NULL,
            iso_week          INTEGER NOT NULL,
            active_posts      INTEGER NOT NULL DEFAULT 0,
            deleted_posts     INTEGER NOT NULL DEFAULT 0,
            active_comments   INTEGER NOT NULL DEFAULT 0,
            deleted_comments  INTEGER NOT NULL DEFAULT 0,
            net_new_posts     INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (iso_year, iso_week)
        );
        CREATE INDEX IF NOT EXISTS idx_{table}_week
            ON {table} (iso_year DESC, iso_week DESC);
    """,
    pipeline_config.table_hidden_metrics: """
        CREATE TABLE IF NOT EXISTS {table} (
            metric_key                VARCHAR(64) PRIMARY KEY,
            peak_hour                 INTEGER NOT NULL DEFAULT 0,
            avg_response_time_hours   REAL    NOT NULL DEFAULT 0,
            dormant_user_pct          REAL    NOT NULL DEFAULT 0,
            post_survival_rate        REAL    NOT NULL DEFAULT 0,
            comments_per_active_user  REAL    NOT NULL DEFAULT 0,
            single_post_author_pct    REAL    NOT NULL DEFAULT 0,
            weekend_post_pct          REAL    NOT NULL DEFAULT 0
        );
    """,
    pipeline_config.table_summary: """
        CREATE TABLE IF NOT EXISTS {table} (
            metric_key      VARCHAR(64) PRIMARY KEY,
            total_posts     INTEGER NOT NULL DEFAULT 0,
            total_comments  INTEGER NOT NULL DEFAULT 0
        );
    """,
    pipeline_config.table_posts_by_day_of_week: """
        CREATE TABLE IF NOT EXISTS {table} (
            day_of_week   INTEGER NOT NULL PRIMARY KEY,
            day_name      VARCHAR(16) NOT NULL,
            post_count    INTEGER NOT NULL DEFAULT 0
        );
    """,
}

# ---------------------------------------------------------------------------
# Upsert SQL builders
# ---------------------------------------------------------------------------

_UPSERT_SQL: dict[str, str] = {
    pipeline_config.table_daily_activity: """
        INSERT INTO {table} (activity_date, category_name, post_count, comment_count)
        VALUES (:activity_date, :category_name, :post_count, :comment_count)
        ON CONFLICT (activity_date, category_name) DO UPDATE SET
            post_count    = EXCLUDED.post_count,
            comment_count = EXCLUDED.comment_count
    """,
    pipeline_config.table_user_engagement: """
        INSERT INTO {table} (user_hash, posts_created, comments_made,
                             engagement_score, first_activity, last_activity)
        VALUES (:user_hash, :posts_created, :comments_made,
                :engagement_score, :first_activity, :last_activity)
        ON CONFLICT (user_hash) DO UPDATE SET
            posts_created    = EXCLUDED.posts_created,
            comments_made    = EXCLUDED.comments_made,
            engagement_score = EXCLUDED.engagement_score,
            first_activity   = LEAST({table}.first_activity, EXCLUDED.first_activity),
            last_activity    = GREATEST({table}.last_activity, EXCLUDED.last_activity)
    """,
    pipeline_config.table_category_trends: """
        INSERT INTO {table} (trend_date, category_name, posts_7d, cumulative_posts)
        VALUES (:trend_date, :category_name, :posts_7d, :cumulative_posts)
        ON CONFLICT (trend_date, category_name) DO UPDATE SET
            posts_7d         = EXCLUDED.posts_7d,
            cumulative_posts = EXCLUDED.cumulative_posts
    """,
    pipeline_config.table_content_stats: """
        INSERT INTO {table} (category_name, avg_post_length, median_post_length,
                             max_post_length, total_posts, total_comments,
                             avg_comments_per_post)
        VALUES (:category_name, :avg_post_length, :median_post_length,
                :max_post_length, :total_posts, :total_comments,
                :avg_comments_per_post)
        ON CONFLICT (category_name) DO UPDATE SET
            avg_post_length      = EXCLUDED.avg_post_length,
            median_post_length   = EXCLUDED.median_post_length,
            max_post_length      = EXCLUDED.max_post_length,
            total_posts          = EXCLUDED.total_posts,
            total_comments       = EXCLUDED.total_comments,
            avg_comments_per_post = EXCLUDED.avg_comments_per_post
    """,
    pipeline_config.table_top_contributors: """
        INSERT INTO {table} (encrypted_name, posts_created, comments_made,
                             total_contributions, contribution_rank)
        VALUES (:encrypted_name, :posts_created, :comments_made,
                :total_contributions, :contribution_rank)
        ON CONFLICT (encrypted_name) DO UPDATE SET
            posts_created       = EXCLUDED.posts_created,
            comments_made       = EXCLUDED.comments_made,
            total_contributions = EXCLUDED.total_contributions,
            contribution_rank   = EXCLUDED.contribution_rank
    """,
    pipeline_config.table_posts_by_category: """
        INSERT INTO {table} (category_name, active_posts, deleted_posts,
                             total_posts, deletion_rate)
        VALUES (:category_name, :active_posts, :deleted_posts,
                :total_posts, :deletion_rate)
        ON CONFLICT (category_name) DO UPDATE SET
            active_posts  = EXCLUDED.active_posts,
            deleted_posts = EXCLUDED.deleted_posts,
            total_posts   = EXCLUDED.total_posts,
            deletion_rate = EXCLUDED.deletion_rate
    """,
    pipeline_config.table_weekly_report: """
        INSERT INTO {table} (iso_year, iso_week, active_posts, deleted_posts,
                             active_comments, deleted_comments, net_new_posts)
        VALUES (:iso_year, :iso_week, :active_posts, :deleted_posts,
                :active_comments, :deleted_comments, :net_new_posts)
        ON CONFLICT (iso_year, iso_week) DO UPDATE SET
            active_posts     = EXCLUDED.active_posts,
            deleted_posts    = EXCLUDED.deleted_posts,
            active_comments  = EXCLUDED.active_comments,
            deleted_comments = EXCLUDED.deleted_comments,
            net_new_posts    = EXCLUDED.net_new_posts
    """,
    pipeline_config.table_hidden_metrics: """
        INSERT INTO {table} (metric_key, peak_hour, avg_response_time_hours,
                             dormant_user_pct, post_survival_rate,
                             comments_per_active_user, single_post_author_pct,
                             weekend_post_pct)
        VALUES (:metric_key, :peak_hour, :avg_response_time_hours,
                :dormant_user_pct, :post_survival_rate,
                :comments_per_active_user, :single_post_author_pct,
                :weekend_post_pct)
        ON CONFLICT (metric_key) DO UPDATE SET
            peak_hour                = EXCLUDED.peak_hour,
            avg_response_time_hours  = EXCLUDED.avg_response_time_hours,
            dormant_user_pct         = EXCLUDED.dormant_user_pct,
            post_survival_rate       = EXCLUDED.post_survival_rate,
            comments_per_active_user = EXCLUDED.comments_per_active_user,
            single_post_author_pct   = EXCLUDED.single_post_author_pct,
            weekend_post_pct         = EXCLUDED.weekend_post_pct
    """,
    pipeline_config.table_summary: """
        INSERT INTO {table} (metric_key, total_posts, total_comments)
        VALUES (:metric_key, :total_posts, :total_comments)
        ON CONFLICT (metric_key) DO UPDATE SET
            total_posts    = EXCLUDED.total_posts,
            total_comments = EXCLUDED.total_comments
    """,
    pipeline_config.table_posts_by_day_of_week: """
        INSERT INTO {table} (day_of_week, day_name, post_count)
        VALUES (:day_of_week, :day_name, :post_count)
        ON CONFLICT (day_of_week) DO UPDATE SET
            day_name   = EXCLUDED.day_name,
            post_count = EXCLUDED.post_count
    """,
}

# Public API
# ---------------------------------------------------------------------------


def ensure_analytics_tables(conn: Connection) -> None:
    """Create all analytics tables and indexes if they don't exist."""
    for table, ddl_template in _ANALYTICS_DDL.items():
        ddl = ddl_template.format(table=table)
        for statement in ddl.strip().split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(text(stmt))
        conn.commit()
        logger.info("Ensured table: %s", table)


def load_dataframe(conn: Connection, df: pd.DataFrame, table_name: str) -> int:
    """Upsert *df* into *table_name* in batches. Returns total rows written."""
    if df.empty:
        logger.warning("Empty DataFrame — skipping load for %s", table_name)
        return 0

    upsert_template = _UPSERT_SQL.get(table_name)
    if upsert_template is None:
        raise ValueError(f"No upsert SQL defined for table '{table_name}'")

    upsert_sql = text(upsert_template.format(table=table_name))
    batch_size = pipeline_config.load_batch_size
    records = df.to_dict(orient="records")
    total = 0

    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        # Convert pandas Timestamps / dates to Python native types
        for rec in batch:
            for k, v in rec.items():
                if isinstance(v, pd.Timestamp):
                    rec[k] = v.to_pydatetime()
        conn.execute(upsert_sql, batch)
        conn.commit()
        total += len(batch)
        logger.debug("Loaded batch %d–%d into %s", i, i + len(batch), table_name)

    logger.info("Loaded %d rows into %s", total, table_name)
    return total
