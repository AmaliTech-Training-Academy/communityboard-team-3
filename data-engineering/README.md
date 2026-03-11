# Data Engineering — CommunityBoard ETL Pipeline

A production-grade ETL pipeline that extracts operational data from the CommunityBoard PostgreSQL database, transforms it into 8 analytical views, and loads the results into dedicated analytics tables — all with built-in PII anonymization, incremental processing, and reversible encryption.

---

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Source Schema](#source-schema)
- [Analytics Tables](#analytics-tables)
- [Data Flow](#data-flow)
- [Privacy & Security](#privacy--security)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the Pipeline](#running-the-pipeline)
- [Docker Deployment](#docker-deployment)
- [Verification Queries](#verification-queries)
- [Scheduling](#scheduling)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        CommunityBoard Stack                        │
│                                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────────┐│
│  │  Frontend   │    │  Backend    │    │   Data Engineering       ││
│  │  React/TS   │◄──►│  Spring Boot│───►│   Python ETL Pipeline    ││
│  │  :3000      │    │  :8080      │    │                          ││
│  └─────────────┘    └──────┬──────┘    │  ┌────────┐              ││
│                            │           │  │Extract │──► Batched   ││
│                            ▼           │  │        │   SQL reads  ││
│                     ┌────────────┐     │  ├────────┤              ││
│                     │ PostgreSQL │◄────│  │Transform│──► Anonymize││
│                     │ Source DB  │     │  │        │   Aggregate  ││
│                     │ :5433      │     │  ├────────┤              ││
│                     └────────────┘     │  │  Load  │──► Upsert    ││
│                                        │  └───┬────┘              ││
│                     ┌────────────┐     │      │                   ││
│                     │ PostgreSQL │◄────│──────┘                   ││
│                     │ Analytics  │     │                          ││
│                     │ :5434      │     └──────────────────────────┘│
│                     └────────────┘                                 │
└────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
data-engineering/
├── config.py               # Database connection + PipelineConfig (single source of truth)
├── db.py                   # SQLAlchemy engine, logging, schema validation
├── seed_data.py            # Seeds demo data (30 users, 80 posts, 330 comments)
├── etl_pipeline.py         # Legacy entry point (delegates to etl.pipeline)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container image definition
├── .env.example            # Environment variable template
│
├── etl/                    # ← Core ETL package
│   ├── __init__.py         # Package marker (v1.0.0)
│   ├── extract.py          # Batched SQL extraction + watermark tracking
│   ├── transform.py        # 8 analytics transforms + anonymization + encryption
│   ├── load.py             # DDL creation + upsert loading for all analytics tables
│   ├── pipeline.py         # Orchestrator — ties E → T → L together
│   └── docs/
│       └── ETL_DOCUMENTATION.md
│
└── logs/                   # Auto-created log files (one per module)
    ├── pipeline.log
    └── seed_data.log
```

---

## Source Schema

The pipeline reads from 4 operational tables managed by the Spring Boot backend:

[ERD Community](docs/image/community_board.png)

## Analytics Tables

The pipeline produces **8 denormalized analytics tables** optimized for dashboard reads:

| # | Table | Primary Key | Description |
|---|---|---|---|
| 1 | `analytics_daily_activity` | `(activity_date, category_name)` | Daily post & comment counts per category |
| 2 | `analytics_user_engagement` | `user_hash` | Per-user engagement score, activity window |
| 3 | `analytics_category_trends` | `(trend_date, category_name)` | 7-day rolling & cumulative post counts |
| 4 | `analytics_content_stats` | `category_name` | Avg/median/max content length, comment ratios |
| 5 | `analytics_top_contributors` | `encrypted_name` | Ranked leaderboard with encrypted reversible name |
| 6 | `analytics_posts_by_category` | `category_name` | Active vs deleted breakdown, deletion rate |
| 7 | `analytics_weekly_report` | `(iso_year, iso_week)` | Weekly status summary (active/deleted/net new) |
| 8 | `analytics_hidden_metrics` | `metric_key` | Peak hour, response time, dormancy, survival rate |

Plus 1 internal tracking table:

| Table | Purpose |
|---|---|
| `etl_watermarks` | Tracks last-extracted timestamp per source table for incremental runs |

### Analytics Table Schemas

<details>
<summary><strong>analytics_daily_activity</strong></summary>

| Column | Type | Description |
|---|---|---|
| `activity_date` | `DATE` | Calendar date |
| `category_name` | `VARCHAR(128)` | Category name |
| `post_count` | `INTEGER` | Posts created that day |
| `comment_count` | `INTEGER` | Comments created that day |

</details>

<details>
<summary><strong>analytics_user_engagement</strong></summary>

| Column | Type | Description |
|---|---|---|
| `user_hash` | `VARCHAR(16)` | SHA-256 anonymized user identifier |
| `posts_created` | `INTEGER` | Total posts by user |
| `comments_made` | `INTEGER` | Total comments by user |
| `engagement_score` | `INTEGER` | Weighted score: `posts × 3 + comments` |
| `first_activity` | `TIMESTAMP` | Earliest post or comment |
| `last_activity` | `TIMESTAMP` | Most recent post or comment |

</details>

<details>
<summary><strong>analytics_category_trends</strong></summary>

| Column | Type | Description |
|---|---|---|
| `trend_date` | `DATE` | Calendar date |
| `category_name` | `VARCHAR(128)` | Category name |
| `posts_7d` | `INTEGER` | Posts in the trailing 7 days |
| `cumulative_posts` | `INTEGER` | Running total of posts |

</details>

<details>
<summary><strong>analytics_content_stats</strong></summary>

| Column | Type | Description |
|---|---|---|
| `category_name` | `VARCHAR(128)` | Category name |
| `avg_post_length` | `REAL` | Mean content length (chars) |
| `median_post_length` | `INTEGER` | Median content length |
| `max_post_length` | `INTEGER` | Longest post |
| `total_posts` | `INTEGER` | Posts in category |
| `total_comments` | `INTEGER` | Comments in category |
| `avg_comments_per_post` | `REAL` | Comment-to-post ratio |

</details>

<details>
<summary><strong>analytics_top_contributors</strong></summary>

| Column | Type | Description |
|---|---|---|
| `encrypted_name` | `TEXT` | AES-256-GCM encrypted real name (PK, reversible) |
| `posts_created` | `INTEGER` | Total posts |
| `comments_made` | `INTEGER` | Total comments |
| `total_contributions` | `INTEGER` | `posts + comments` |
| `contribution_rank` | `INTEGER` | Dense rank (1 = top) |

</details>

<details>
<summary><strong>analytics_posts_by_category</strong></summary>

| Column | Type | Description |
|---|---|---|
| `category_name` | `VARCHAR(128)` | Category name |
| `active_posts` | `INTEGER` | Non-deleted posts |
| `deleted_posts` | `INTEGER` | Soft-deleted posts |
| `total_posts` | `INTEGER` | `active + deleted` |
| `deletion_rate` | `REAL` | `deleted / total` (0.0 – 1.0) |

</details>

<details>
<summary><strong>analytics_weekly_report</strong></summary>

| Column | Type | Description |
|---|---|---|
| `iso_year` | `INTEGER` | ISO year number |
| `iso_week` | `INTEGER` | ISO week number (1–53) |
| `active_posts` | `INTEGER` | Non-deleted posts that week |
| `deleted_posts` | `INTEGER` | Deleted posts that week |
| `active_comments` | `INTEGER` | Non-deleted comments |
| `deleted_comments` | `INTEGER` | Deleted comments |
| `net_new_posts` | `INTEGER` | `active - deleted` |

</details>

<details>
<summary><strong>analytics_hidden_metrics</strong></summary>

| Column | Type | Description |
|---|---|---|
| `metric_key` | `VARCHAR(64)` | Always `"global"` (single row) |
| `peak_hour` | `INTEGER` | Hour (0–23) with most posts |
| `avg_response_time_hours` | `REAL` | Avg hours between post and first comment |
| `dormant_user_pct` | `REAL` | % of users with zero contributions |
| `post_survival_rate` | `REAL` | % of posts NOT deleted |
| `comments_per_active_user` | `REAL` | Avg comments among users who commented |
| `single_post_author_pct` | `REAL` | % of authors with exactly one post |
| `weekend_post_pct` | `REAL` | % of posts created on weekends |

</details>

---

## Data Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                          ETL Pipeline                              │
│                                                                    │
│  ┌─────────┐     ┌──────────────┐     ┌─────────┐     ┌────────┐   │
│  │ PREPARE │────►│   EXTRACT    │────►│TRANSFORM│────►│  LOAD  │   │
│  └─────────┘     └──────────────┘     └─────────┘     └───┬────┘   │
│       │                │                    │              │       │
│  Create tables   Read watermarks      Anonymize PII    Upsert      │
│  if missing      Query only NEW       Encrypt names    INSERT ON   │
│                  rows (> watermark)    Aggregate 8      CONFLICT   │
│                  Batch by 10,000      analytics         UPDATE     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ WATERMARK UPDATE: Save max(created_at) for next run          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Processing Mode: Incremental**

The pipeline always runs incrementally — only rows newer than the last watermark are processed.
On the first run (no watermarks), all existing data is processed.

```bash
python -m etl.pipeline
```

---

## Privacy & Security

### Dual-layer protection

| Layer | Method | Reversible? | Purpose |
|---|---|---|---|
| **Anonymization** | SHA-256 + salt | No | `user_hash` — one-way identifier for joins |
| **Encryption** | AES-256-GCM + KMS | Yes | `encrypted_name` — decode for dashboard display |

### How anonymization works

```python
# SHA-256 hash with configurable salt (one-way, irreversible)
salted = f"{ETL_HASH_SALT}:{user_email}"
user_hash = sha256(salted)[:16]   # → "a3f8b2c1e9d04567"
```

### How encryption works

AES-256-GCM (Galois/Counter Mode) provides authenticated encryption —
both confidentiality and integrity in a single pass.

```python
# AES-256-GCM encryption via the KMS layer (reversible with key)
from etl.kms import encrypt, decrypt

token = encrypt("John Doe")     # → URL-safe base64(iv ‖ ciphertext ‖ tag)
name  = decrypt(token)           # → "John Doe"
```

Each call generates a **unique 96-bit IV** — encrypting the same name twice
produces different tokens, preventing pattern analysis.

### Key Management System (KMS)

The `etl/kms.py` module abstracts key resolution behind a provider interface:

| Provider | Env Vars | Use Case |
|---|---|---|
| **`local`** | `ETL_KMS_KEY` (64 hex chars or 44-char base64) | Dev / single-node deployment |
| **`aws`** | `ETL_KMS_AWS_KEY_ID`, `ETL_KMS_AWS_REGION` | Production — envelope encryption via AWS KMS |

### Generating a local 256-bit key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Set the result in your `.env`:
```
ETL_KMS_PROVIDER=local
ETL_KMS_KEY=<generated-hex-key>
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **PostgreSQL 15+** (or Docker)
- Source tables populated (by the backend or `seed_data.py`)

### Local Setup

```bash
cd data-engineering

# 1. Create virtual environment
python -m venv .venv
source .venv/bin/activate    # Linux/Mac
.venv\Scripts\activate       # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and KMS key

# 4. Seed demo data (optional — if DB is empty)
python seed_data.py

# 5. Run the pipeline (incremental)
python -m etl.pipeline
```

### Docker Setup

```bash
# From the project root
docker compose up --build
```

This starts PostgreSQL → seeds data → runs the ETL pipeline automatically.

---

## Configuration

All settings are controlled via environment variables with sensible defaults:

### Database

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Source PostgreSQL host |
| `DB_PORT` | `5432` | Source PostgreSQL port |
| `DB_NAME` | `communityboard` | Source database name |
| `DB_USER` | `postgres` | Source database user |
| `DB_PASSWORD` | `your_db_password` | Source database password |
| `ANALYTICS_DB_HOST` | *(falls back to DB_HOST)* | Analytics PostgreSQL host |
| `ANALYTICS_DB_PORT` | *(falls back to DB_PORT)* | Analytics PostgreSQL port |
| `ANALYTICS_DB_NAME` | `communityboard_analytics` | Analytics database name |
| `ANALYTICS_DB_USER` | *(falls back to DB_USER)* | Analytics database user |
| `ANALYTICS_DB_PASSWORD` | *(falls back to DB_PASSWORD)* | Analytics database password |

### Pipeline

| Variable | Default | Description |
|---|---|---|
| `ETL_EXTRACT_BATCH_SIZE` | `10000` | Rows per extraction batch (controls memory) |
| `ETL_LOAD_BATCH_SIZE` | `5000` | Rows per upsert batch |
| `ETL_ANONYMIZE_PII` | `true` | Enable SHA-256 anonymization |
| `ETL_HASH_SALT` | `communityboard-etl-salt-2024` | Salt for hash determinism |
| `ETL_KMS_PROVIDER` | `local` | KMS provider: `local` or `aws` |
| `ETL_KMS_KEY` | *(empty)* | 256-bit AES key (hex or base64) for local provider |
| `ETL_KMS_AWS_KEY_ID` | *(empty)* | AWS KMS key ARN (when provider = aws) |
| `ETL_KMS_AWS_REGION` | `us-east-1` | AWS region (when provider = aws) |

---

## Running the Pipeline

### CLI

```bash
# Incremental — only new rows since last run
python -m etl.pipeline

# Legacy entry point (same behavior)
python etl_pipeline.py
```

### Expected Output

```
2026-03-10 14:30:00 [INFO] etl.pipeline: ============================================================
2026-03-10 14:30:00 [INFO] etl.pipeline: CommunityBoard ETL Pipeline v1.0 (incremental)
2026-03-10 14:30:00 [INFO] etl.pipeline: ============================================================
2026-03-10 14:30:00 [INFO] etl.pipeline: Mode: INCREMENTAL | posts watermark: none | comments watermark: none
2026-03-10 14:30:01 [INFO] etl.pipeline: Extracted: 80 posts, 330 comments, 30 users
2026-03-10 14:30:01 [INFO] etl.transform: Daily activity: 12 rows
2026-03-10 14:30:01 [INFO] etl.transform: User engagement: 30 rows
2026-03-10 14:30:01 [INFO] etl.transform: Category trends: 48 rows
2026-03-10 14:30:01 [INFO] etl.transform: Content stats: 4 rows
2026-03-10 14:30:01 [INFO] etl.transform: Top contributors: 30 rows
2026-03-10 14:30:01 [INFO] etl.transform: Posts by category: 4 rows
2026-03-10 14:30:01 [INFO] etl.transform: Weekly report: 5 rows
2026-03-10 14:30:01 [INFO] etl.transform: Hidden metrics: 1 rows
2026-03-10 14:30:02 [INFO] etl.pipeline: Pipeline complete in 1.85s
2026-03-10 14:30:02 [INFO] etl.pipeline: ────────────────────────────────────────────────────────────
2026-03-10 14:30:02 [INFO] etl.pipeline: Summary:
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_daily_activity                  12 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_user_engagement                 30 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_category_trends                 48 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_content_stats                   4 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_top_contributors                30 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_posts_by_category               4 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_weekly_report                   5 rows
2026-03-10 14:30:02 [INFO] etl.pipeline:   analytics_hidden_metrics                  1 rows
2026-03-10 14:30:02 [INFO] etl.pipeline: ============================================================
```

---

## Docker Deployment

The pipeline runs as the `data-etl` service in `docker-compose.yml`:

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
    ANALYTICS_DB_HOST: postgres-analytics
    ANALYTICS_DB_PORT: 5432
    ANALYTICS_DB_NAME: communityboard_analytics
    ANALYTICS_DB_USER: postgres
    ANALYTICS_DB_PASSWORD: ${DB_PASSWORD}
  depends_on:
    data-seed:
      condition: service_completed_successfully
    postgres-analytics:
      condition: service_healthy
```

**Service startup order:** `postgres` + `postgres-analytics` → `backend` → `data-seed` → `data-etl`

The analytics data is written to a separate `postgres-analytics` container (port `5434` on host), keeping the operational and analytical workloads isolated.

---

## Verification Queries

After running the pipeline, verify the analytics tables (connect to the **analytics** database on port `5434`):

```sql
-- Connect to analytics DB
-- psql -h localhost -p 5434 -U postgres -d communityboard_analytics
-- Daily activity breakdown
SELECT * FROM analytics_daily_activity ORDER BY activity_date DESC LIMIT 10;

-- Top 10 contributors (with decryptable names)
SELECT encrypted_name, posts_created, comments_made,
       total_contributions, contribution_rank
FROM analytics_top_contributors
ORDER BY contribution_rank
LIMIT 10;

-- Category health
SELECT category_name, active_posts, deleted_posts,
       ROUND(deletion_rate * 100, 1) || '%' AS deletion_pct
FROM analytics_posts_by_category;

-- Weekly trend
SELECT iso_year, iso_week, active_posts, deleted_posts, net_new_posts
FROM analytics_weekly_report
ORDER BY iso_year DESC, iso_week DESC;

-- Hidden metrics
SELECT * FROM analytics_hidden_metrics;

-- Row counts across all analytics tables
SELECT 'daily_activity'    AS t, COUNT(*) FROM analytics_daily_activity
UNION ALL SELECT 'user_engagement',  COUNT(*) FROM analytics_user_engagement
UNION ALL SELECT 'category_trends',  COUNT(*) FROM analytics_category_trends
UNION ALL SELECT 'content_stats',    COUNT(*) FROM analytics_content_stats
UNION ALL SELECT 'top_contributors', COUNT(*) FROM analytics_top_contributors
UNION ALL SELECT 'posts_by_category',COUNT(*) FROM analytics_posts_by_category
UNION ALL SELECT 'weekly_report',    COUNT(*) FROM analytics_weekly_report
UNION ALL SELECT 'hidden_metrics',   COUNT(*) FROM analytics_hidden_metrics;
```

---

## Scheduling

The pipeline supports automatic scheduling using the `schedule` library:

```python
# Add to CLI for continuous runs
python -m etl.pipeline --schedule 15   # Every 15 minutes
```

**Alternatives:**

| Method | When to Use |
|---|---|
| `schedule` (built-in) | Single pipeline, simple cron-like interval |
| OS cron / Task Scheduler | Production Linux/Windows servers |
| Apache Airflow | 5+ pipelines, team visibility, SLA monitoring |

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `No new data — nothing to transform` | Watermarks are ahead of all data | Delete the `etl_watermarks` table and re-run |
| `FATAL: password authentication failed` | Wrong DB credentials | Check `.env` matches `docker-compose.yml` |
| `Table 'X' does not exist` | Backend hasn't run yet | Start backend first, or seed with `python seed_data.py` |
| `encrypted_name` is empty | `ETL_KMS_KEY` not set | Generate a key: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ModuleNotFoundError: cryptography` | Dependency not installed | `pip install -r requirements.txt` |

### Reset analytics tables

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

Then run `python -m etl.pipeline` to rebuild everything.

### Check logs

```bash
# Pipeline logs
cat data-engineering/logs/pipeline.log

# Seed data logs
cat data-engineering/logs/seed_data.log
```

---

## Tech Stack

| Component | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| pandas | 2.1.3 | DataFrame transformations |
| SQLAlchemy | 2.0.23 | Database access |
| psycopg2-binary | 2.9.9 | PostgreSQL driver |
| cryptography | 42.0.5 | AES-256-GCM encryption for reversible PII |
| python-dotenv | 1.0.0 | Environment variable loading |
| schedule | 1.2.1 | Optional cron-like scheduling |
| PostgreSQL | 15 | Source + analytics database |
| Docker | — | Containerized deployment |

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Upsert over truncate-reload** | No data loss during partial failures; safe for concurrent reads |
| **Watermark-based incremental** | Only processes new data — O(new rows) not O(total rows) |
| **Batched extraction** | Bounded memory — 10K rows/batch even with millions of source rows |
| **SHA-256 for `user_hash`** | Deterministic, irreversible — same user always gets same hash |
| **AES-256-GCM + KMS for `encrypted_name`** | Authenticated encryption — confidentiality + integrity; KMS abstraction supports local keys and AWS |
| **Denormalized analytics** | Single-query reads — no joins needed for dashboards |
| **No FK on analytics tables** | Independent loads, faster upserts, different granularities |
| **Separate analytics database** | Isolates read-heavy analytics from operational writes; independent scaling |
| **Single PostgreSQL engine** | Cost-effective — lightweight separate instance, no data warehouse needed at this scale |
