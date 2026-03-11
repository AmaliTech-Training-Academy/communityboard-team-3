import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

# Source database — operational tables (users, posts, comments, categories)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "communityboard"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}

DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"

# Analytics database — ETL output tables (separate from source)
ANALYTICS_DB_CONFIG = {
    "host": os.getenv("ANALYTICS_DB_HOST", DB_CONFIG["host"]),
    "port": os.getenv("ANALYTICS_DB_PORT", DB_CONFIG["port"]),
    "database": os.getenv("ANALYTICS_DB_NAME", "communityboard_analytics"),
    "user": os.getenv("ANALYTICS_DB_USER", DB_CONFIG["user"]),
    "password": os.getenv("ANALYTICS_DB_PASSWORD", DB_CONFIG["password"]),
}

ANALYTICS_DATABASE_URL = f"postgresql://{ANALYTICS_DB_CONFIG['user']}:{ANALYTICS_DB_CONFIG['password']}@{ANALYTICS_DB_CONFIG['host']}:{ANALYTICS_DB_CONFIG['port']}/{ANALYTICS_DB_CONFIG['database']}"


# Pipeline configuration — controls ETL behaviour
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PipelineConfig:
    """Controls pipeline behaviour — batch sizes, target tables, etc."""

    # --- Batch & performance ---
    extract_batch_size: int = int(os.getenv("ETL_EXTRACT_BATCH_SIZE", "10000"))
    load_batch_size: int = int(os.getenv("ETL_LOAD_BATCH_SIZE", "5000"))

    # --- Anonymization & Encryption ---
    anonymize_pii: bool = os.getenv("ETL_ANONYMIZE_PII", "true").lower() == "true"
    hash_salt: str = os.getenv("ETL_HASH_SALT", "communityboard-etl-salt-2024")
    kms_provider: str = os.getenv("ETL_KMS_PROVIDER", "local")   # "local" | "aws"
    kms_key: str = os.getenv("ETL_KMS_KEY", "")                   # 256-bit key (hex or base64) for local provider
    # AWS KMS (only when kms_provider=aws)
    # ETL_KMS_AWS_KEY_ID and ETL_KMS_AWS_REGION are read directly in etl/kms.py

    # --- Target analytics tables ---
    table_daily_activity: str = "analytics_daily_activity"
    table_user_engagement: str = "analytics_user_engagement"
    table_category_trends: str = "analytics_category_trends"
    table_content_stats: str = "analytics_content_stats"
    table_top_contributors: str = "analytics_top_contributors"
    table_posts_by_category: str = "analytics_posts_by_category"
    table_weekly_report: str = "analytics_weekly_report"
    table_hidden_metrics: str = "analytics_hidden_metrics"
    table_summary: str = "analytics_summary"
    table_posts_by_day_of_week: str = "analytics_posts_by_day_of_week"
    table_watermarks: str = "etl_watermarks"

    # --- Analytics schema ---
    analytics_schema: str = "public"


pipeline_config = PipelineConfig()
