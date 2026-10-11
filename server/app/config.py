import os
from pathlib import Path
from typing import Optional

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings  # fallback


class Settings(BaseSettings):
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DATA_CSV_PATH: str = "data/sample_prices.csv"

    def resolve_data_csv_path(self) -> Path:
        """
        Locates sample_prices.csv searching multiple possible directories:
        1. Explicit path in settings
        2. server/data/sample_prices.csv
        3. data/sample_prices.csv (root)
        4. Parent relative paths
        """
        current_dir = Path(__file__).resolve().parent
        repo_root = current_dir.parent.parent

        candidates = [
            Path(self.DATA_CSV_PATH),
            repo_root / "data" / "sample_prices.csv",
            repo_root / "server" / "data" / "sample_prices.csv",
            current_dir.parent / "data" / "sample_prices.csv",
            Path.cwd() / "data" / "sample_prices.csv",
            Path.cwd() / "server" / "data" / "sample_prices.csv",
        ]

        for cand in candidates:
            if cand.exists() and cand.is_file():
                return cand.resolve()

        return candidates[0]


settings = Settings()


def get_settings() -> Settings:
    return settings
