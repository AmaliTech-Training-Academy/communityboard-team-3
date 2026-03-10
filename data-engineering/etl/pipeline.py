"""
ETL Pipeline Orchestrator — the main entry point.

Coordinates the full Extract → Transform → Load flow:
  1. Ensures analytics target tables exist
  2. Reads high-water-marks for incremental extraction
  3. Extracts posts, comments, users in batches
  4. Runs all transformations (anonymization, aggregation, trends)
  5. Loads results via upsert into analytics tables
  6. Updates watermarks on success

Usage:
    python -m etl.pipeline              # incremental run
    python -m etl.pipeline --full       # ignore watermarks, reprocess everything
"""

from __future__ import annotations

import argparse
import sys
import time
import logging
from datetime import datetime

import pandas as pd
from sqlalchemy.engine import Engine

# -- shared db module (one level up) ---
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))
from db import get_engine, setup_logging          # noqa: E402

from config import pipeline_config                # noqa: E402
from etl.extract import (                         # noqa: E402
    ensure_watermark_table,
    get_watermark,
    set_watermark,
    extract_posts,
    extract_comments,
    extract_users,
)
from etl.transform import (                       # noqa: E402
    transform_daily_activity,
    transform_user_engagement,
    transform_category_trends,
    transform_content_stats,
    transform_top_contributors,
    transform_posts_by_category,
    transform_weekly_report,
    transform_hidden_metrics,
)
from etl.load import ensure_analytics_tables, load_dataframe  # noqa: E402

logger = setup_logging("etl.pipeline")


# Helpers
# ---------------------------------------------------------------------------

def _collect_batches(batch_iter) -> pd.DataFrame:
    """Concatenate an iterator of DataFrames into one."""
    chunks = list(batch_iter)
    if not chunks:
        return pd.DataFrame()
    return pd.concat(chunks, ignore_index=True)


def _max_timestamp(df: pd.DataFrame, col: str) -> datetime | None:
    """Return the max value of *col* or None if empty."""
    if df.empty or col not in df.columns:
        return None
    ts = pd.to_datetime(df[col]).max()
    return ts.to_pydatetime() if pd.notna(ts) else None


# Pipeline
# ---------------------------------------------------------------------------

def run_pipeline(engine: Engine, full: bool = False) -> dict:
    """Execute the complete ETL pipeline. Returns a summary dict."""
    t0 = time.time()
    summary: dict = {"started_at": datetime.utcnow().isoformat(), "tables": {}}

    with engine.connect() as conn:
        # --- 0. Prepare ---------------------------------------------------
        ensure_watermark_table(conn)
        ensure_analytics_tables(conn)

        # --- 1. Extract ---------------------------------------------------
        posts_wm = None if full else get_watermark(conn, "posts")
        comments_wm = None if full else get_watermark(conn, "comments")

        logger.info(
            "Mode: %s | posts watermark: %s | comments watermark: %s",
            "FULL" if full else "INCREMENTAL",
            posts_wm or "none",
            comments_wm or "none",
        )

        posts_df = _collect_batches(extract_posts(conn, since=posts_wm))
        comments_df = _collect_batches(extract_comments(conn, since=comments_wm))
        users_df = extract_users(conn)

        logger.info(
            "Extracted: %d posts, %d comments, %d users",
            len(posts_df), len(comments_df), len(users_df),
        )

        if posts_df.empty and comments_df.empty:
            logger.info("No new data — nothing to transform.")
            summary["skipped"] = True
            return summary

        # --- 2. Transform ------------------------------------------------
        daily_activity = transform_daily_activity(posts_df, comments_df)
        user_engagement = transform_user_engagement(users_df, posts_df, comments_df)
        category_trends = transform_category_trends(posts_df)
        content_stats = transform_content_stats(posts_df, comments_df)
        top_contributors = transform_top_contributors(users_df, posts_df, comments_df)
        posts_by_category = transform_posts_by_category(posts_df)
        weekly_report = transform_weekly_report(posts_df, comments_df)
        hidden_metrics = transform_hidden_metrics(posts_df, comments_df, users_df)

        # --- 3. Load -----------------------------------------------------
        for table, df in [
            (pipeline_config.table_daily_activity, daily_activity),
            (pipeline_config.table_user_engagement, user_engagement),
            (pipeline_config.table_category_trends, category_trends),
            (pipeline_config.table_content_stats, content_stats),
            (pipeline_config.table_top_contributors, top_contributors),
            (pipeline_config.table_posts_by_category, posts_by_category),
            (pipeline_config.table_weekly_report, weekly_report),
            (pipeline_config.table_hidden_metrics, hidden_metrics),
        ]:
            rows = load_dataframe(conn, df, table)
            summary["tables"][table] = rows

        # --- 4. Update watermarks ---------------------------------------
        new_post_wm = _max_timestamp(posts_df, "created_at")
        new_comment_wm = _max_timestamp(comments_df, "created_at")

        if new_post_wm:
            set_watermark(conn, "posts", new_post_wm)
        if new_comment_wm:
            set_watermark(conn, "comments", new_comment_wm)

    elapsed = round(time.time() - t0, 2)
    summary["elapsed_seconds"] = elapsed
    logger.info("Pipeline complete in %.2fs", elapsed)
    return summary


# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="CommunityBoard ETL Pipeline")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Ignore watermarks and reprocess all data",
    )
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("CommunityBoard ETL Pipeline v1.0")
    logger.info("=" * 60)

    engine = get_engine()
    summary = run_pipeline(engine, full=args.full)

    logger.info("─" * 60)
    logger.info("Summary:")
    for table, rows in summary.get("tables", {}).items():
        logger.info("  %-40s %d rows", table, rows)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
