"""
Transform layer — anonymization, aggregation, and enrichment.

Key responsibilities:
  1. Anonymize PII (emails, names) with salted SHA-256 hashes
  2. Aggregate daily post/comment activity by category
  3. Compute per-user engagement scores
  4. Derive category popularity trends (7-day rolling)
  5. Produce content-length statistics
  6. Rank top contributors
  7. Total posts by category with status breakdown
  8. Weekly report by status (active / deleted)
  9. Hidden metrics (peak hours, response time, dormancy, survival rate)
"""

from __future__ import annotations

import hashlib
import logging
from typing import Callable

import pandas as pd

from config import pipeline_config
from etl.kms import encrypt, decrypt

logger = logging.getLogger("etl.transform")


def encrypt_value(value: str) -> str:
    """Encrypt *value* with AES-256-GCM via the KMS layer."""
    return encrypt(value)


def decrypt_value(token: str) -> str:
    """Decrypt an AES-256-GCM token back to the original string."""
    return decrypt(token)


# Anonymization helpers
# ---------------------------------------------------------------------------

def _hash_value(value: str) -> str:
    """Return a deterministic SHA-256 hex digest of *value* + salt."""
    salted = f"{pipeline_config.hash_salt}:{value}"
    return hashlib.sha256(salted.encode("utf-8")).hexdigest()[:16]


def anonymize_df(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """Replace each value in *columns* with its salted hash.

    Returns a **copy** so the original DataFrame is untouched.
    """
    if not pipeline_config.anonymize_pii:
        return df

    out = df.copy()
    for col in columns:
        if col in out.columns:
            out[col] = out[col].astype(str).apply(_hash_value)
            logger.debug("Anonymized column '%s' (%d values)", col, len(out))
    return out


# 1. Daily activity aggregation
# ---------------------------------------------------------------------------

def transform_daily_activity(posts: pd.DataFrame, comments: pd.DataFrame) -> pd.DataFrame:
    """Aggregate daily counts of posts and comments per category.

    Output columns:
        activity_date, category_name, post_count, comment_count
    """
    if posts.empty:
        logger.warning("No posts to aggregate for daily activity")
        return pd.DataFrame(
            columns=["activity_date", "category_name", "post_count", "comment_count"]
        )

    posts = posts[~posts["is_deleted"]].copy()
    posts["activity_date"] = pd.to_datetime(posts["created_at"]).dt.date

    # Post counts per day/category
    post_agg = (
        posts.groupby(["activity_date", "category_name"])
        .size()
        .reset_index(name="post_count")
    )

    # Comment counts per day/category (join through post to get category)
    if not comments.empty:
        comments = comments[~comments["is_deleted"]].copy()
        comments["activity_date"] = pd.to_datetime(comments["created_at"]).dt.date
        # Map post_id → category_name
        post_cat = posts[["id", "category_name"]].drop_duplicates().rename(
            columns={"id": "post_id"}
        )
        comments_with_cat = comments.merge(post_cat, on="post_id", how="left")
        comment_agg = (
            comments_with_cat.groupby(["activity_date", "category_name"])
            .size()
            .reset_index(name="comment_count")
        )
    else:
        comment_agg = pd.DataFrame(
            columns=["activity_date", "category_name", "comment_count"]
        )

    daily = post_agg.merge(
        comment_agg, on=["activity_date", "category_name"], how="outer"
    ).fillna(0)

    daily["post_count"] = daily["post_count"].astype(int)
    daily["comment_count"] = daily["comment_count"].astype(int)

    logger.info("Daily activity: %d rows", len(daily))
    return daily


# 2. User engagement metrics
# ---------------------------------------------------------------------------

def transform_user_engagement(
    users: pd.DataFrame,
    posts: pd.DataFrame,
    comments: pd.DataFrame,
) -> pd.DataFrame:
    """Compute per-user engagement metrics with anonymized identifiers.

    Output columns:
        user_hash, posts_created, comments_made,
        engagement_score, first_activity, last_activity
    """
    # Anonymize upfront
    users_anon = anonymize_df(users, ["email", "name"])

    posts = posts[~posts["is_deleted"]].copy()
    comments = comments[~comments["is_deleted"]].copy()

    # Post counts
    post_counts = (
        posts.groupby("author_id")
        .agg(
            posts_created=("id", "size"),
            first_post=("created_at", "min"),
            last_post=("created_at", "max"),
        )
        .reset_index()
    )

    # Comment counts
    comment_counts = (
        comments.groupby("author_id")
        .agg(
            comments_made=("id", "size"),
            first_comment=("created_at", "min"),
            last_comment=("created_at", "max"),
        )
        .reset_index()
    )

    # Merge onto users
    engagement = users_anon[["id", "email"]].rename(
        columns={"id": "author_id", "email": "user_hash"}
    )
    engagement = engagement.merge(post_counts, on="author_id", how="left")
    engagement = engagement.merge(comment_counts, on="author_id", how="left")

    engagement["posts_created"] = engagement["posts_created"].fillna(0).astype(int)
    engagement["comments_made"] = engagement["comments_made"].fillna(0).astype(int)

    # Engagement score = posts * 3 + comments (posts weighted higher)
    engagement["engagement_score"] = (
        engagement["posts_created"] * 3 + engagement["comments_made"]
    )

    # First / last activity across both posts and comments
    for prefix in ("first", "last"):
        post_col = f"{prefix}_post"
        comment_col = f"{prefix}_comment"
        fn: Callable = min if prefix == "first" else max
        engagement[f"{prefix}_activity"] = engagement[[post_col, comment_col]].apply(
            lambda row: fn(
                (v for v in [row[post_col], row[comment_col]] if pd.notna(v)),
                default=None,
            ),
            axis=1,
        )

    engagement = engagement.drop(
        columns=["author_id", "first_post", "last_post", "first_comment", "last_comment"]
    )

    logger.info("User engagement: %d rows", len(engagement))
    return engagement


# 3. Category popularity trends (7-day rolling)
# ---------------------------------------------------------------------------

def transform_category_trends(posts: pd.DataFrame) -> pd.DataFrame:
    """Compute 7-day rolling post counts per category.

    Output columns:
        trend_date, category_name, posts_7d, cumulative_posts
    """
    if posts.empty:
        return pd.DataFrame(
            columns=["trend_date", "category_name", "posts_7d", "cumulative_posts"]
        )

    posts = posts[~posts["is_deleted"]].copy()
    posts["trend_date"] = pd.to_datetime(posts["created_at"]).dt.date

    daily = (
        posts.groupby(["trend_date", "category_name"])
        .size()
        .reset_index(name="daily_posts")
    )

    # Build a complete date × category grid so rolling window works correctly
    all_dates = pd.date_range(
        daily["trend_date"].min(), daily["trend_date"].max(), freq="D"
    ).date
    all_cats = daily["category_name"].unique()
    grid = pd.MultiIndex.from_product(
        [all_dates, all_cats], names=["trend_date", "category_name"]
    ).to_frame(index=False)

    daily = grid.merge(daily, on=["trend_date", "category_name"], how="left")
    daily["daily_posts"] = daily["daily_posts"].fillna(0).astype(int)
    daily = daily.sort_values(["category_name", "trend_date"])

    # Rolling 7-day sum & cumulative
    daily["posts_7d"] = (
        daily.groupby("category_name")["daily_posts"]
        .transform(lambda s: s.rolling(7, min_periods=1).sum())
        .astype(int)
    )
    daily["cumulative_posts"] = (
        daily.groupby("category_name")["daily_posts"].cumsum().astype(int)
    )

    result = daily.drop(columns=["daily_posts"])
    logger.info("Category trends: %d rows", len(result))
    return result


# 4. Content statistics
# ---------------------------------------------------------------------------

def transform_content_stats(posts: pd.DataFrame, comments: pd.DataFrame) -> pd.DataFrame:
    """Compute content-length statistics per category.

    Output columns:
        category_name, avg_post_length, median_post_length,
        max_post_length, total_posts, total_comments,
        avg_comments_per_post
    """
    if posts.empty:
        return pd.DataFrame(
            columns=[
                "category_name", "avg_post_length", "median_post_length",
                "max_post_length", "total_posts", "total_comments",
                "avg_comments_per_post",
            ]
        )

    posts = posts[~posts["is_deleted"]].copy()
    posts["content_length"] = posts["content"].astype(str).str.len()

    post_stats = posts.groupby("category_name").agg(
        avg_post_length=("content_length", "mean"),
        median_post_length=("content_length", "median"),
        max_post_length=("content_length", "max"),
        total_posts=("id", "size"),
    ).reset_index()

    post_stats["avg_post_length"] = post_stats["avg_post_length"].round(1)
    post_stats["median_post_length"] = post_stats["median_post_length"].astype(int)
    post_stats["max_post_length"] = post_stats["max_post_length"].astype(int)

    if not comments.empty:
        comments = comments[~comments["is_deleted"]].copy()
        post_cat = posts[["id", "category_name"]].drop_duplicates().rename(
            columns={"id": "post_id"}
        )
        comm_cat = comments.merge(post_cat, on="post_id", how="left")
        comment_counts = (
            comm_cat.groupby("category_name")
            .size()
            .reset_index(name="total_comments")
        )
        post_stats = post_stats.merge(comment_counts, on="category_name", how="left")
    else:
        post_stats["total_comments"] = 0

    post_stats["total_comments"] = post_stats["total_comments"].fillna(0).astype(int)
    post_stats["avg_comments_per_post"] = (
        post_stats["total_comments"] / post_stats["total_posts"]
    ).round(2)

    logger.info("Content stats: %d rows", len(post_stats))
    return post_stats


# 5. Top contributors (ranked leaderboard)
# ---------------------------------------------------------------------------

def transform_top_contributors(
    users: pd.DataFrame,
    posts: pd.DataFrame,
    comments: pd.DataFrame,
) -> pd.DataFrame:
    """Rank users by total contribution (posts + comments).

    Output columns:
        encrypted_name, posts_created, comments_made, total_contributions,
        contribution_rank
    """
    active_posts = posts[~posts["is_deleted"]].copy()
    active_comments = comments[~comments["is_deleted"]].copy()

    post_counts = (
        active_posts.groupby("author_id").size().reset_index(name="posts_created")
    )
    comment_counts = (
        active_comments.groupby("author_id").size().reset_index(name="comments_made")
    )

    # Build contributor frame with encrypted name as identifier
    contrib = users[["id", "name"]].rename(columns={"id": "author_id"})
    contrib["encrypted_name"] = contrib["name"].fillna("").apply(encrypt_value)
    contrib = contrib.drop(columns=["name"])

    contrib = contrib.merge(post_counts, on="author_id", how="left")
    contrib = contrib.merge(comment_counts, on="author_id", how="left")

    contrib["posts_created"] = contrib["posts_created"].fillna(0).astype(int)
    contrib["comments_made"] = contrib["comments_made"].fillna(0).astype(int)
    contrib["total_contributions"] = contrib["posts_created"] + contrib["comments_made"]

    # Rank by total_contributions descending (dense rank — no gaps)
    contrib["contribution_rank"] = (
        contrib["total_contributions"]
        .rank(method="dense", ascending=False)
        .astype(int)
    )
    contrib = contrib.drop(columns=["author_id"]).sort_values("contribution_rank")

    logger.info("Top contributors: %d rows", len(contrib))
    return contrib


# 6. Posts by category with status breakdown
# ---------------------------------------------------------------------------

def transform_posts_by_category(posts: pd.DataFrame) -> pd.DataFrame:
    """Total posts per category split by active / deleted.

    Output columns:
        category_name, active_posts, deleted_posts, total_posts, deletion_rate
    """
    if posts.empty:
        return pd.DataFrame(
            columns=[
                "category_name", "active_posts", "deleted_posts",
                "total_posts", "deletion_rate",
            ]
        )

    active = (
        posts[~posts["is_deleted"]]
        .groupby("category_name").size()
        .reset_index(name="active_posts")
    )
    deleted = (
        posts[posts["is_deleted"]]
        .groupby("category_name").size()
        .reset_index(name="deleted_posts")
    )

    result = active.merge(deleted, on="category_name", how="outer").fillna(0)
    result["active_posts"] = result["active_posts"].astype(int)
    result["deleted_posts"] = result["deleted_posts"].astype(int)
    result["total_posts"] = result["active_posts"] + result["deleted_posts"]
    result["deletion_rate"] = (
        result["deleted_posts"] / result["total_posts"]
    ).round(4)

    logger.info("Posts by category: %d rows", len(result))
    return result


# 7. Weekly report by status
# ---------------------------------------------------------------------------

def transform_weekly_report(
    posts: pd.DataFrame,
    comments: pd.DataFrame,
) -> pd.DataFrame:
    """ISO-week level summary of posts and comments by status.

    Output columns:
        iso_year, iso_week, active_posts, deleted_posts,
        active_comments, deleted_comments, net_new_posts
    """
    if posts.empty:
        return pd.DataFrame(
            columns=[
                "iso_year", "iso_week", "active_posts", "deleted_posts",
                "active_comments", "deleted_comments", "net_new_posts",
            ]
        )

    p = posts.copy()
    p["created_at"] = pd.to_datetime(p["created_at"])
    p["iso_year"] = p["created_at"].dt.isocalendar().year.astype(int)
    p["iso_week"] = p["created_at"].dt.isocalendar().week.astype(int)

    week_posts = p.groupby(["iso_year", "iso_week", "is_deleted"]).size().unstack(
        fill_value=0
    )
    # Columns may be True/False booleans
    active_p = week_posts.get(False, pd.Series(0, index=week_posts.index)).astype(int)
    deleted_p = week_posts.get(True, pd.Series(0, index=week_posts.index)).astype(int)

    wp = pd.DataFrame({
        "iso_year": active_p.index.get_level_values("iso_year"),
        "iso_week": active_p.index.get_level_values("iso_week"),
        "active_posts": active_p.values,
        "deleted_posts": deleted_p.values,
    })

    # Comments
    if not comments.empty:
        c = comments.copy()
        c["created_at"] = pd.to_datetime(c["created_at"])
        c["iso_year"] = c["created_at"].dt.isocalendar().year.astype(int)
        c["iso_week"] = c["created_at"].dt.isocalendar().week.astype(int)

        week_comments = c.groupby(["iso_year", "iso_week", "is_deleted"]).size().unstack(
            fill_value=0
        )
        active_c = week_comments.get(False, pd.Series(0, index=week_comments.index)).astype(int)
        deleted_c = week_comments.get(True, pd.Series(0, index=week_comments.index)).astype(int)

        wc = pd.DataFrame({
            "iso_year": active_c.index.get_level_values("iso_year"),
            "iso_week": active_c.index.get_level_values("iso_week"),
            "active_comments": active_c.values,
            "deleted_comments": deleted_c.values,
        })
        wp = wp.merge(wc, on=["iso_year", "iso_week"], how="outer").fillna(0)
    else:
        wp["active_comments"] = 0
        wp["deleted_comments"] = 0

    for col in ["active_posts", "deleted_posts", "active_comments", "deleted_comments"]:
        wp[col] = wp[col].astype(int)

    wp["net_new_posts"] = wp["active_posts"] - wp["deleted_posts"]
    wp = wp.sort_values(["iso_year", "iso_week"])

    logger.info("Weekly report: %d rows", len(wp))
    return wp


# 8. Hidden metrics — behavioural insights
# ---------------------------------------------------------------------------

def transform_hidden_metrics(
    posts: pd.DataFrame,
    comments: pd.DataFrame,
    users: pd.DataFrame,
) -> pd.DataFrame:
    """Compute non-obvious behavioural metrics across the community.

    Output — single-row DataFrame with columns:
        peak_hour, avg_response_time_hours, dormant_user_pct,
        post_survival_rate, comments_per_active_user,
        single_post_author_pct, weekend_post_pct
    """
    active_posts = posts[~posts["is_deleted"]].copy()
    active_comments = comments[~comments["is_deleted"]].copy()

    # 1. Peak posting hour (0-23)
    if not active_posts.empty:
        hours = pd.to_datetime(active_posts["created_at"]).dt.hour
        peak_hour = int(hours.mode().iloc[0])
    else:
        peak_hour = 0

    # 2. Avg time-to-first-comment (hours)
    if not active_posts.empty and not active_comments.empty:
        first_comments = (
            active_comments.groupby("post_id")["created_at"]
            .min()
            .reset_index(name="first_comment_at")
        )
        merged = active_posts[["id", "created_at"]].merge(
            first_comments, left_on="id", right_on="post_id", how="inner"
        )
        merged["response_hours"] = (
            (pd.to_datetime(merged["first_comment_at"]) - pd.to_datetime(merged["created_at"]))
            .dt.total_seconds() / 3600
        )
        avg_response = round(merged["response_hours"].mean(), 2)
    else:
        avg_response = 0.0

    # 3. Dormant user % (users with zero posts AND zero comments)
    posting_users = set(active_posts["author_id"].unique()) if not active_posts.empty else set()
    commenting_users = set(active_comments["author_id"].unique()) if not active_comments.empty else set()
    active_user_ids = posting_users | commenting_users
    total_users = len(users) if not users.empty else 1
    dormant_pct = round((total_users - len(active_user_ids)) / total_users * 100, 2)

    # 4. Post survival rate (% of posts NOT deleted)
    total_posts_all = len(posts) if not posts.empty else 1
    survival_rate = round(len(active_posts) / total_posts_all * 100, 2)

    # 5. Comments per active user
    if active_user_ids and not active_comments.empty:
        comments_per_active = round(len(active_comments) / len(active_user_ids), 2)
    else:
        comments_per_active = 0.0

    # 6. Single-post author % (authors who posted exactly once)
    if not active_posts.empty:
        author_counts = active_posts["author_id"].value_counts()
        single_authors = int((author_counts == 1).sum())
        single_post_pct = round(single_authors / len(author_counts) * 100, 2)
    else:
        single_post_pct = 0.0

    # 7. Weekend posting % (Sat + Sun)
    if not active_posts.empty:
        dow = pd.to_datetime(active_posts["created_at"]).dt.dayofweek  # Mon=0, Sun=6
        weekend_pct = round((dow >= 5).sum() / len(active_posts) * 100, 2)
    else:
        weekend_pct = 0.0

    result = pd.DataFrame([{
        "metric_key": "global",
        "peak_hour": peak_hour,
        "avg_response_time_hours": avg_response,
        "dormant_user_pct": dormant_pct,
        "post_survival_rate": survival_rate,
        "comments_per_active_user": comments_per_active,
        "single_post_author_pct": single_post_pct,
        "weekend_post_pct": weekend_pct,
    }])

    logger.info(
        "Hidden metrics: peak_hour=%d, avg_response=%.1fh, dormant=%.1f%%, survival=%.1f%%",
        peak_hour, avg_response, dormant_pct, survival_rate,
    )
    return result


# 9. Summary totals (Total Posts, Total Comments)
# ---------------------------------------------------------------------------

def transform_summary(posts: pd.DataFrame, comments: pd.DataFrame) -> pd.DataFrame:
    """Compute grand totals for the dashboard header cards.

    Output columns:
        metric_key, total_posts, total_comments
    """
    total_posts = int((~posts["is_deleted"]).sum()) if not posts.empty else 0
    total_comments = int((~comments["is_deleted"]).sum()) if not comments.empty else 0

    result = pd.DataFrame([{
        "metric_key": "global",
        "total_posts": total_posts,
        "total_comments": total_comments,
    }])

    logger.info("Summary: %d posts, %d comments", total_posts, total_comments)
    return result


# 10. Posts by day of week (Mon–Sun bar chart)
# ---------------------------------------------------------------------------

_DAY_NAMES = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"]


def transform_posts_by_day_of_week(posts: pd.DataFrame) -> pd.DataFrame:
    """Count active posts per day of week (0=Mon … 6=Sun).

    Output columns:
        day_of_week, day_name, post_count
    """
    if posts.empty:
        return pd.DataFrame(
            columns=["day_of_week", "day_name", "post_count"]
        )

    active = posts[~posts["is_deleted"]].copy()
    active["day_of_week"] = pd.to_datetime(active["created_at"]).dt.dayofweek  # Mon=0

    counts = active.groupby("day_of_week").size().reset_index(name="post_count")

    # Ensure all 7 days present
    all_days = pd.DataFrame({"day_of_week": range(7)})
    counts = all_days.merge(counts, on="day_of_week", how="left").fillna(0)
    counts["post_count"] = counts["post_count"].astype(int)
    counts["day_name"] = counts["day_of_week"].map(lambda d: _DAY_NAMES[d])

    logger.info("Posts by day of week: %d rows", len(counts))
    return counts
