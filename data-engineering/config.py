import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "communityboard"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}

DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"


# Pipeline configuration — controls ETL behaviour
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PipelineConfig:
    """Controls pipeline behaviour — batch sizes, target tables, etc."""

    # --- Batch & performance ---
    extract_batch_size: int = int(os.getenv("ETL_EXTRACT_BATCH_SIZE", "10000"))
    load_batch_size: int = int(os.getenv("ETL_LOAD_BATCH_SIZE", "5000"))

    # --- Anonymization ---
    anonymize_pii: bool = os.getenv("ETL_ANONYMIZE_PII", "true").lower() == "true"
    hash_salt: str = os.getenv("ETL_HASH_SALT", "communityboard-etl-salt-2024")

    # --- Target analytics tables ---
    table_daily_activity: str = "analytics_daily_activity"
    table_user_engagement: str = "analytics_user_engagement"
    table_category_trends: str = "analytics_category_trends"
    table_content_stats: str = "analytics_content_stats"
    table_top_contributors: str = "analytics_top_contributors"
    table_posts_by_category: str = "analytics_posts_by_category"
    table_weekly_report: str = "analytics_weekly_report"
    table_hidden_metrics: str = "analytics_hidden_metrics"
    table_watermarks: str = "etl_watermarks"

    # --- Analytics schema ---
    analytics_schema: str = "public"


pipeline_config = PipelineConfig()
