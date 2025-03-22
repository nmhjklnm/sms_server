import os
from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 基本配置
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///sms_database.db")
    api_key: str = os.getenv("API_KEY", "sk-nmhjklnm")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8322"))
    log_level: str = os.getenv("LOG_LEVEL", "info").lower()

    # 数据库配置
    db_connect_args: Dict[str, Any] = {"check_same_thread": False}

    # 应用配置
    app_title: str = "SMS 验证码接收服务"
    app_version: str = "1.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# 创建一个全局可用的设置实例
settings = Settings()
