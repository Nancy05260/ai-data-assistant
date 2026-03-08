"""配置管理 - 从 .env 读取环境变量"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    # DeepSeek
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"

    # 数据库
    app_db_path: str = "./app.db"
    biz_db_path: str = "./data/business.db"

    # LLM
    llm_timeout: int = 30
    llm_max_retries: int = 2
    sql_result_limit: int = 200

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
