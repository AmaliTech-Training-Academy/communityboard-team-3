# CommunityBoard ETL Pipeline

**Version:** 1.0.0  
**Author:** Data Engineering Team Lead by Ernest Kwisanga  
**Last Updated:** 2026-03-10

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Data Flow](#data-flow)
5. [Extract Layer](#extract-layer)
6. [Transform Layer](#transform-layer)
7. [Load Layer](#load-layer)
8. [Anonymization & PII Handling](#anonymization--pii-handling)
9. [Analytics Tables Schema](#analytics-tables-schema)
10. [Incremental Processing](#incremental-processing)
11. [Configuration Reference](#configuration-reference)
12. [Running the Pipeline](#running-the-pipeline)
13. [Docker Deployment](#docker-deployment)
14. [Scalability Design](#scalability-design)
15. [Troubleshooting](#troubleshooting)

---

## Overview

The CommunityBoard ETL pipeline extracts data from the application's PostgreSQL database, anonymizes personally identifiable information (PII), transforms raw records into analytics-ready aggregations, and loads results into dedicated analytics tables — all using **upsert** logic so data is never lost.

### Key Features

| Feature                    | Description                                                        |
|----------------------------|--------------------------------------------------------------------|
| **Incremental loading**    | High-water-mark timestamps skip already-processed rows             |
| **Batch processing**       | Configurable chunk sizes keep memory bounded for millions of rows  |
| **PII anonymization**      | Salted SHA-256 hashing of emails and names before analytics        |
| **Upsert (no data loss)**  | `INSERT … ON CONFLICT UPDATE` replaces `if_exists="replace"`      |
| **8 analytics outputs**    | Daily activity, engagement, trends, content, contributors, weekly, category status, hidden metrics |
| **Structured logging**     | Dual console + file logging via shared `db.py` helper              |
| **Incremental only**       | Watermark-based extraction ensures only new rows are processed    |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CommunityBoard App DB                       │
│   ┌──────────┐  ┌────────────┐  ┌─────────┐  ┌──────────────┐   │
│   │  users   │  │   posts    │  │comments │  │ categories   │   │
│   └──────────┘  └────────────┘  └─────────┘  └──────────────┘   │
└──────────┬──────────┬──────────────┬──────────────┬─────────────┘
           │          │              │              │
     ┌─────▼──────────▼──────────────▼──────────────▼──────┐
     │                  EXTRACT LAYER                      │
     │  • Batched SQL queries (configurable chunk size)    │
     │  • Incremental via watermark timestamps             │
     │  • Returns Iterator[DataFrame] for memory safety    │
     └──────────────────────┬──────────────────────────────┘
                            │
     ┌──────────────────────▼──────────────────────────────┐
     │                 TRANSFORM LAYER                     │
     │  • Anonymize PII (SHA-256 + salt)                   │
     │  • Daily activity aggregation                       │
     │  • User engagement scoring                          │
     │  • 7-day rolling category trends                    │
     │  • Content length statistics                        │
     │  • Top contributors ranking                         │
     │  • Posts by category with status breakdown           │
     │  • Weekly report by status                           │
     │  • Hidden behavioural metrics                        │
     └──────────────────────┬──────────────────────────────┘
                            │
     ┌──────────────────────▼──────────────────────────────┐
     │                   LOAD LAYER                        │
     │  • CREATE TABLE IF NOT EXISTS + indexes             │
     │  • Upsert in configurable batches                   │
     │  • Atomic per-table transactions                    │
     └──────────────────────┬──────────────────────────────┘
                            │
     ┌──────────────────────▼──────────────────────────────┐
     │               ANALYTICS TABLES                      │
     │  analytics_daily_activity                           │
     │  analytics_user_engagement                          │
     │  analytics_category_trends                          │
     │  analytics_content_stats                            │
     │  analytics_top_contributors                          │
     │  analytics_posts_by_category                         │
     │  analytics_weekly_report                             │
     │  analytics_hidden_metrics                            │
     │  etl_watermarks                                     │
     └─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
data-engineering/
├── config.py              # Database connection config (shared)
├── db.py                  # Shared engine, logging, schema validation
├── seed_data.py           # Seed data generator (30 users, 80 posts, 330 comments)
├── etl_pipeline.py        # Legacy entry point (delegates to etl.pipeline)
├── requirements.txt       # Python dependencies
├── Dockerfile             # Container image
├── .env.example           # Environment variable template
│
└── etl/                   # ← NEW: Modular ETL package
    ├── __init__.py        # Package marker + version
    ├── extract.py         # Extract layer (batched queries, watermarks)
    ├── transform.py       # Transform layer (anonymize, aggregate, enrich)
    ├── load.py            # Load layer (DDL, upserts, batch writes)
    └── pipeline.py        # Orchestrator — ties E, T, L together
```

---

## Data Flow

### Step-by-step Execution

| Step | Phase     | What Happens                                                 |
|------|-----------|--------------------------------------------------------------|
| 0    | Prepare   | Create `etl_watermarks` and all analytics tables if missing  |
| 1    | Extract   | Read watermarks, query posts/comments/users incrementally    |
| 2    | Transform | Anonymize PII, compute 8 analytics aggregations             |
| 3    | Load      | Upsert results into analytics tables in batches              |
| 4    | Finalize  | Update watermarks with max `created_at` from extracted data  |

### Data Lineage

```
users  ──┐
         ├── transform_user_engagement    ──► analytics_user_engagement
posts  ──┤
      ├── transform_daily_activity     ──► analytics_daily_activity
comments ┤
          ├── transform_category_trends   ──► analytics_category_trends
          ├── transform_content_stats     ──► analytics_content_stats
          ├── transform_top_contributors  ──► analytics_top_contributors
          ├── transform_posts_by_category ──► analytics_posts_by_category
          ├── transform_weekly_report     ──► analytics_weekly_report
          └── transform_hidden_metrics    ──► analytics_hidden_metrics
```

---

## Extract Layer

**Module:** `etl/extract.py`

### Source Tables

| Table        | Key Columns Used                                      |
|--------------|-------------------------------------------------------|
| `posts`      | id, title, content, created_at, updated_at, is_deleted, author_id, category_id |
| `comments`   | id, content, created_at, is_deleted, post_id, author_id |
| `users`      | id, name, email, role, created_at, is_active          |
| `categories` | id, name (joined through posts)                       |

### Batch Processing

Extractions return `Iterator[pd.DataFrame]` — each batch is `ETL_EXTRACT_BATCH_SIZE` rows (default 10,000). This means:

- **100 rows** → 1 batch, fits in memory easily
- **1,000,000 rows** → 100 batches, only 10K rows in memory at a time
- **10,000,000 rows** → 1,000 batches, still bounded memory

### Incremental Mode

The pipeline tracks the maximum `created_at` timestamp from each extraction. On the next run, only rows with `created_at > watermark` are extracted.

```
First run:   SELECT * FROM posts ORDER BY created_at                    -- full scan
Second run:  SELECT * FROM posts WHERE created_at > '2026-03-09 14:00' -- incremental
```

---

## Transform Layer

**Module:** `etl/transform.py`

### 1. Daily Activity (`transform_daily_activity`)

Aggregates daily post and comment counts per category.

| Output Column   | Type    | Description                     |
|-----------------|---------|---------------------------------|
| activity_date   | DATE    | Calendar date                   |
| category_name   | VARCHAR | Category (News, Events, etc.)   |
| post_count      | INTEGER | Posts created that day           |
| comment_count   | INTEGER | Comments created that day        |

### 2. User Engagement (`transform_user_engagement`)

Computes per-user activity metrics with **anonymized** identifiers.

| Output Column     | Type      | Description                             |
|-------------------|-----------|-----------------------------------------|
| user_hash         | VARCHAR   | SHA-256 hash of email (PII-safe)        |
| posts_created     | INTEGER   | Total posts by this user                |
| comments_made     | INTEGER   | Total comments by this user             |
| engagement_score  | INTEGER   | Weighted score: posts×3 + comments      |
| first_activity    | TIMESTAMP | Earliest post or comment                |
| last_activity     | TIMESTAMP | Most recent post or comment             |

**Engagement scoring formula:**
```
engagement_score = (posts_created × 3) + comments_made
```
Posts are weighted 3× because creating a post requires more effort than commenting.

### 3. Category Trends (`transform_category_trends`)

Rolling 7-day post counts per category — useful for detecting trending topics.

| Output Column    | Type    | Description                          |
|------------------|---------|--------------------------------------|
| trend_date       | DATE    | Calendar date                        |
| category_name    | VARCHAR | Category name                        |
| posts_7d         | INTEGER | Posts in the trailing 7-day window   |
| cumulative_posts | INTEGER | Running total of posts in category   |

The transform builds a complete date × category grid so the rolling window works even on days with zero posts.

### 4. Content Statistics (`transform_content_stats`)

Per-category content-length metrics.

| Output Column           | Type    | Description                          |
|-------------------------|---------|--------------------------------------|
| category_name           | VARCHAR | Category name                        |
| avg_post_length         | REAL    | Average character count of posts     |
| median_post_length      | INTEGER | Median character count               |
| max_post_length         | INTEGER | Longest post                         |
| total_posts             | INTEGER | Number of posts in category          |
| total_comments          | INTEGER | Number of comments in category       |
| avg_comments_per_post   | REAL    | Comments per post ratio              |

### 5. Top Contributors (`transform_top_contributors`)

Ranked leaderboard of community contributors with anonymized identifiers.

| Output Column         | Type    | Description                                |
|-----------------------|---------|--------------------------------------------|
| encrypted_name        | TEXT    | AES-256-GCM encrypted real name (PK, reversible)|
| posts_created         | INTEGER | Total posts by this user                   |
| comments_made         | INTEGER | Total comments by this user                |
| total_contributions   | INTEGER | posts_created + comments_made              |
| contribution_rank     | INTEGER | Dense rank (1 = top contributor, no gaps)  |

### 6. Posts by Category (`transform_posts_by_category`)

Category-level breakdown showing active vs deleted posts.

| Output Column   | Type    | Description                                    |
|-----------------|---------|------------------------------------------------|
| category_name   | VARCHAR | Category name                                  |
| active_posts    | INTEGER | Posts that are NOT deleted                     |
| deleted_posts   | INTEGER | Posts that ARE deleted                         |
| total_posts     | INTEGER | active_posts + deleted_posts                   |
| deletion_rate   | REAL    | deleted_posts / total_posts (0.0 – 1.0)        |

### 7. Weekly Report (`transform_weekly_report`)

ISO-week level summary of posts and comments split by status (active vs deleted).

| Output Column     | Type    | Description                                  |
|-------------------|---------|----------------------------------------------|
| iso_year          | INTEGER | ISO calendar year                            |
| iso_week          | INTEGER | ISO week number (1–53)                       |
| active_posts      | INTEGER | New posts that week (not deleted)            |
| deleted_posts     | INTEGER | Posts deleted that week                      |
| active_comments   | INTEGER | New comments that week (not deleted)         |
| deleted_comments  | INTEGER | Comments deleted that week                   |
| net_new_posts     | INTEGER | active_posts − deleted_posts                 |

### 8. Hidden Metrics (`transform_hidden_metrics`)

Non-obvious behavioural insights derived from the data. Single-row output.

| Output Column              | Type    | Description                                       |
|----------------------------|---------|---------------------------------------------------|
| metric_key                 | VARCHAR | Always `"global"` (extendable per-category later) |
| peak_hour                  | INTEGER | Most common posting hour (0–23)                   |
| avg_response_time_hours    | REAL    | Average hours until first comment on a post       |
| dormant_user_pct           | REAL    | % of registered users with zero activity          |
| post_survival_rate         | REAL    | % of posts that are NOT deleted                   |
| comments_per_active_user   | REAL    | Comments ÷ users who have at least 1 action       |
| single_post_author_pct     | REAL    | % of authors who posted exactly once              |
| weekend_post_pct           | REAL    | % of posts created on Saturday or Sunday          |

---

## Anonymization & PII Handling

The pipeline **never stores raw emails or names** in analytics tables.

### How It Works

1. A configurable salt (`ETL_HASH_SALT`) is prepended to each PII value
2. The combined string is hashed with **SHA-256**
3. Only the first 16 hex characters are stored (sufficient for uniqueness)

```python
"communityboard-etl-salt-2024:maria.chen@example.com"
    → SHA-256 → "a3f8b2c1d9e04f71..."  (truncated to 16 chars)
```

### Controls

| Env Variable        | Default                           | Effect                       |
|---------------------|-----------------------------------|------------------------------|
| `ETL_ANONYMIZE_PII` | `true`                            | Set `false` to disable       |
| `ETL_HASH_SALT`     | `communityboard-etl-salt-2024`    | Change salt for different hashes |

### What Gets Anonymized

| Source Column  | Analytics Column | Treatment                |
|----------------|------------------|--------------------------|
| `users.email`  | `user_hash`      | Salted SHA-256 (16 hex)  |
| `users.name`   | *(dropped)*      | Not stored in analytics  |

---

## Analytics Tables Schema

### `analytics_daily_activity`

```sql
CREATE TABLE analytics_daily_activity (
    activity_date  DATE         NOT NULL,
    category_name  VARCHAR(128) NOT NULL,
    post_count     INTEGER      NOT NULL DEFAULT 0,
    comment_count  INTEGER      NOT NULL DEFAULT 0,
    PRIMARY KEY (activity_date, category_name)
);
-- Index: idx_analytics_daily_activity_date (activity_date DESC)
```

### `analytics_user_engagement`

```sql
CREATE TABLE analytics_user_engagement (
    user_hash         VARCHAR(16) PRIMARY KEY,
    posts_created     INTEGER     NOT NULL DEFAULT 0,
    comments_made     INTEGER     NOT NULL DEFAULT 0,
    engagement_score  INTEGER     NOT NULL DEFAULT 0,
    first_activity    TIMESTAMP,
    last_activity     TIMESTAMP
);
-- Index: idx_analytics_user_engagement_score (engagement_score DESC)
```

### `analytics_category_trends`

```sql
CREATE TABLE analytics_category_trends (
    trend_date       DATE         NOT NULL,
    category_name    VARCHAR(128) NOT NULL,
    posts_7d         INTEGER      NOT NULL DEFAULT 0,
    cumulative_posts INTEGER      NOT NULL DEFAULT 0,
    PRIMARY KEY (trend_date, category_name)
);
-- Index: idx_analytics_category_trends_date (trend_date DESC)
```

### `analytics_content_stats`

```sql
CREATE TABLE analytics_content_stats (
    category_name         VARCHAR(128) PRIMARY KEY,
    avg_post_length       REAL    NOT NULL DEFAULT 0,
    median_post_length    INTEGER NOT NULL DEFAULT 0,
    max_post_length       INTEGER NOT NULL DEFAULT 0,
    total_posts           INTEGER NOT NULL DEFAULT 0,
    total_comments        INTEGER NOT NULL DEFAULT 0,
    avg_comments_per_post REAL    NOT NULL DEFAULT 0
);
```

### `analytics_top_contributors`

```sql
CREATE TABLE analytics_top_contributors (
    encrypted_name        TEXT    PRIMARY KEY,
    posts_created         INTEGER NOT NULL DEFAULT 0,
    comments_made         INTEGER NOT NULL DEFAULT 0,
    total_contributions   INTEGER NOT NULL DEFAULT 0,
    contribution_rank     INTEGER NOT NULL DEFAULT 0
);
-- Index: idx_analytics_top_contributors_rank (contribution_rank)
```

### `analytics_posts_by_category`

```sql
CREATE TABLE analytics_posts_by_category (
    category_name  VARCHAR(128) PRIMARY KEY,
    active_posts   INTEGER NOT NULL DEFAULT 0,
    deleted_posts  INTEGER NOT NULL DEFAULT 0,
    total_posts    INTEGER NOT NULL DEFAULT 0,
    deletion_rate  REAL    NOT NULL DEFAULT 0
);
```

### `analytics_weekly_report`

```sql
CREATE TABLE analytics_weekly_report (
    iso_year          INTEGER NOT NULL,
    iso_week          INTEGER NOT NULL,
    active_posts      INTEGER NOT NULL DEFAULT 0,
    deleted_posts     INTEGER NOT NULL DEFAULT 0,
    active_comments   INTEGER NOT NULL DEFAULT 0,
    deleted_comments  INTEGER NOT NULL DEFAULT 0,
    net_new_posts     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (iso_year, iso_week)
);
-- Index: idx_analytics_weekly_report_week (iso_year DESC, iso_week DESC)
```

### `analytics_hidden_metrics`

```sql
CREATE TABLE analytics_hidden_metrics (
    metric_key                VARCHAR(64) PRIMARY KEY,
    peak_hour                 INTEGER NOT NULL DEFAULT 0,
    avg_response_time_hours   REAL    NOT NULL DEFAULT 0,
    dormant_user_pct          REAL    NOT NULL DEFAULT 0,
    post_survival_rate        REAL    NOT NULL DEFAULT 0,
    comments_per_active_user  REAL    NOT NULL DEFAULT 0,
    single_post_author_pct    REAL    NOT NULL DEFAULT 0,
    weekend_post_pct          REAL    NOT NULL DEFAULT 0
);
```

### `etl_watermarks`

```sql
CREATE TABLE etl_watermarks (
    source_table       VARCHAR(128) PRIMARY KEY,
    last_extracted_at  TIMESTAMP NOT NULL,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Incremental Processing

### How Watermarks Work

```
Run 1 (first time):
  watermark = NULL → extract ALL posts
  after load → watermark = max(posts.created_at) = '2026-03-09 18:00'

Run 2 (next day):
  watermark = '2026-03-09 18:00' → extract only posts WHERE created_at > watermark
  after load → watermark = '2026-03-10 12:00'

Run N:
  Only ever processes NEW data since last successful run
```

To reset watermarks and reprocess everything, delete the `etl_watermarks` table rows:

```sql
DELETE FROM etl_watermarks;
```

Then re-run `python -m etl.pipeline`.

---

## Configuration Reference

All settings are controlled via environment variables with sensible defaults.

### Database Connection

| Variable      | Default          | Description               |
|---------------|------------------|---------------------------|
| `DB_HOST`     | `localhost`      | PostgreSQL host           |
| `DB_PORT`     | `5432`           | PostgreSQL port           |
| `DB_NAME`     | `communityboard` | Database name             |
| `DB_USER`     | `postgres`       | Database user             |
| `DB_PASSWORD` | `postgres`       | Database password         |

### Pipeline Behavior

| Variable                 | Default                        | Description                           |
|--------------------------|--------------------------------|---------------------------------------|
| `ETL_EXTRACT_BATCH_SIZE` | `10000`                        | Rows per extraction batch             |
| `ETL_LOAD_BATCH_SIZE`    | `5000`                         | Rows per upsert batch                 |
| `ETL_ANONYMIZE_PII`      | `true`                         | Enable/disable PII hashing            |
| `ETL_HASH_SALT`          | `communityboard-etl-salt-2024` | Salt for SHA-256 hashing              |

### Tuning for Scale

| Data Volume     | Recommended `EXTRACT_BATCH_SIZE` | Recommended `LOAD_BATCH_SIZE` |
|-----------------|----------------------------------|-------------------------------|
| < 10K records   | 10000 (default)                  | 5000 (default)                |
| 10K – 100K      | 25000                            | 10000                         |
| 100K – 1M       | 50000                            | 20000                         |
| > 1M records    | 100000                           | 50000                         |

---

## Running the Pipeline

### Local Development

```bash
# Navigate to data-engineering directory
cd data-engineering

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or use .env file)
cp .env.example .env
# Edit .env with actual database credentials

# Run incremental (only new data since last run)
python -m etl.pipeline

# Legacy entry point (same behavior)
python etl_pipeline.py
```

### Verify Results

```sql
-- Check analytics tables
SELECT * FROM analytics_daily_activity ORDER BY activity_date DESC LIMIT 10;
SELECT * FROM analytics_user_engagement ORDER BY engagement_score DESC LIMIT 10;
SELECT * FROM analytics_category_trends ORDER BY trend_date DESC LIMIT 10;
SELECT * FROM analytics_content_stats;
SELECT * FROM analytics_top_contributors ORDER BY contribution_rank LIMIT 10;
SELECT * FROM analytics_posts_by_category;
SELECT * FROM analytics_weekly_report ORDER BY iso_year DESC, iso_week DESC LIMIT 10;
SELECT * FROM analytics_hidden_metrics;

-- Check watermarks
SELECT * FROM etl_watermarks;
```

---

## Docker Deployment

### With docker-compose (recommended)

The ETL runs automatically after the seed data service completes:

```bash
# From project root
docker-compose up data-etl
```

The `docker-compose.yml` defines the service:

```yaml
data-etl:
  build: ./data-engineering
  command: python -m etl.pipeline
  environment:
    DB_HOST: postgres
    DB_PORT: 5432
    DB_NAME: communityboard
    DB_USER: postgres
    DB_PASSWORD: ${DB_PASSWORD}
  depends_on:
    data-seed:
      condition: service_completed_successfully
```

### Standalone Docker

```bash
cd data-engineering

docker build -t communityboard-etl .

docker run --rm \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5433 \
  -e DB_NAME=communityboard \
  -e DB_USER=postgres \
  -e DB_PASSWORD=yourpassword \
  communityboard-etl
```

---

## Scalability Design

### Current Capacity

| Metric               | Capacity                                      |
|----------------------|-----------------------------------------------|
| Memory per batch     | ~10K rows × ~1KB/row ≈ 10 MB                  |
| Peak memory          | ~50 MB (extract batch + transform + load)      |
| 100K records         | Processes in ~10 batches, finishes in seconds  |
| 1M records           | Processes in ~100 batches, bounded memory      |
| 10M records          | Processes in ~1000 batches, same memory footprint |

### Why This Scales

1. **Batched extraction** — Only `EXTRACT_BATCH_SIZE` rows in memory at once
2. **Incremental processing** — After first full run, only new/changed rows are processed
3. **Upsert loading** — No need to drop/recreate tables; only changed rows are written
4. **Connection pooling** — SQLAlchemy engine reuses connections via `pool_pre_ping`
5. **Indexed analytics tables** — Downstream queries are fast even with millions of rows

### Cost Efficiency

| Aspect               | Old Pipeline                     | New Pipeline                    |
|----------------------|----------------------------------|---------------------------------|
| Data processed       | Full table every run             | Only new records (incremental)  |
| Memory usage         | Entire dataset in RAM            | Bounded by batch size           |
| Table writes         | DROP + CREATE every run          | Upsert (update existing rows)   |
| DB connections       | New engine per function call     | Singleton engine, pooled        |
| PII in analytics     | Raw emails exposed               | SHA-256 anonymized              |
| Transformations      | 1 (daily activity only)          | 8 complete analytics views      |
| Error recovery       | None — silent failures           | Structured logging + watermarks |

---

## Troubleshooting

### Common Issues

| Problem                           | Cause                          | Solution                                      |
|-----------------------------------|--------------------------------|-----------------------------------------------|
| `relation "posts" does not exist` | DB not initialized             | Run `seed_data.py` first or start backend     |
| Empty analytics tables            | No data in source tables       | Seed data: `python seed_data.py`              |
| "No new data" message             | Watermarks ahead of data       | Delete watermark rows: `DELETE FROM etl_watermarks` |
| Connection refused                | Wrong DB_HOST or DB_PORT       | Check `.env` matches your database            |
| Permission denied on tables       | DB user lacks privileges       | Grant SELECT on source + ALL on analytics     |

### Logs

Logs are written to both **stdout** and `data-engineering/logs/pipeline.log`:

```
2026-03-10 14:30:00 [INFO] etl.pipeline: CommunityBoard ETL Pipeline v1.0
2026-03-10 14:30:00 [INFO] etl.pipeline: Mode: INCREMENTAL | posts watermark: 2026-03-09 18:00 | comments watermark: 2026-03-09 17:45
2026-03-10 14:30:01 [INFO] etl.extract: Extracting posts since 2026-03-09 18:00 …
2026-03-10 14:30:01 [INFO] etl.extract: Extracting comments since 2026-03-09 17:45 …
2026-03-10 14:30:02 [INFO] etl.pipeline: Extracted: 15 posts, 42 comments, 30 users
2026-03-10 14:30:02 [INFO] etl.transform: Daily activity: 8 rows
2026-03-10 14:30:02 [INFO] etl.transform: User engagement: 30 rows
2026-03-10 14:30:02 [INFO] etl.transform: Category trends: 24 rows
2026-03-10 14:30:02 [INFO] etl.transform: Content stats: 4 rows
2026-03-10 14:30:02 [INFO] etl.transform: Top contributors: 30 rows
2026-03-10 14:30:02 [INFO] etl.transform: Posts by category: 4 rows
2026-03-10 14:30:02 [INFO] etl.transform: Weekly report: 5 rows
2026-03-10 14:30:02 [INFO] etl.transform: Hidden metrics: peak_hour=14, avg_response=3.2h, dormant=10.0%, survival=98.5%
2026-03-10 14:30:03 [INFO] etl.load: Loaded 8 rows into analytics_daily_activity
2026-03-10 14:30:03 [INFO] etl.load: Loaded 30 rows into analytics_user_engagement
2026-03-10 14:30:03 [INFO] etl.load: Loaded 24 rows into analytics_category_trends
2026-03-10 14:30:03 [INFO] etl.load: Loaded 4 rows into analytics_content_stats
2026-03-10 14:30:03 [INFO] etl.load: Loaded 30 rows into analytics_top_contributors
2026-03-10 14:30:03 [INFO] etl.load: Loaded 4 rows into analytics_posts_by_category
2026-03-10 14:30:03 [INFO] etl.load: Loaded 5 rows into analytics_weekly_report
2026-03-10 14:30:03 [INFO] etl.load: Loaded 1 rows into analytics_hidden_metrics
2026-03-10 14:30:03 [INFO] etl.pipeline: Pipeline complete in 2.45s
```

### Reset Everything

To start fresh, drop the analytics tables and watermarks:

```sql
DROP TABLE IF EXISTS analytics_daily_activity;
DROP TABLE IF EXISTS analytics_user_engagement;
DROP TABLE IF EXISTS analytics_category_trends;
DROP TABLE IF EXISTS analytics_content_stats;
DROP TABLE IF EXISTS analytics_top_contributors;
DROP TABLE IF EXISTS analytics_posts_by_category;
DROP TABLE IF EXISTS analytics_weekly_report;
DROP TABLE IF EXISTS analytics_hidden_metrics;
DROP TABLE IF EXISTS etl_watermarks;
```

Then run: `python -m etl.pipeline`
