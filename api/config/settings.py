import os
from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 基本配置
    database_url: Optional[str] = os.getenv("DATABASE_URL", "sqlite:////tmp/data/sms_database.db")
    api_key: Optional[str] = os.getenv("API_KEY", None)
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8322"))
    log_level: str = os.getenv("LOG_LEVEL", "info").lower()

    # 路径配置
    data_dir: str = os.getenv("DATA_DIR", "/tmp/data")
    log_dir: str = os.getenv("LOG_DIR", "/tmp/log")

    # 数据库配置
    db_connect_args: Dict[str, Any] = {"check_same_thread": False}

    # 应用配置
    app_title: str = "SMS 验证码接收服务"
    app_version: str = "1.0"
    
    @property
    def requires_api_key(self) -> bool:
        """检查是否需要API密钥验证"""
        return self.api_key is not None and self.api_key.strip() != ""
    
    @property
    def get_database_url(self) -> str:
        """获取数据库URL，如果未提供则使用默认的SQLite配置"""
        if self.database_url:
            return self.database_url
        # 构建SQLite数据库路径
        db_file = os.path.join(self.data_dir, "sms_database.db")
        return f"sqlite:///{db_file}"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# 创建一个全局可用的设置实例
settings = Settings()
