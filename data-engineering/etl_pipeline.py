"""
CommunityBoard ETL Pipeline — legacy entry point.

This file delegates to the new modular ``etl`` package.
Run directly or via ``python -m etl.pipeline`` for the same result.

    python etl_pipeline.py          # incremental
    python etl_pipeline.py --full   # full reload
"""

from etl.pipeline import main

if __name__ == "__main__":
    main()
