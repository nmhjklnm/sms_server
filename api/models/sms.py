from sqlmodel import SQLModel, Field, create_engine, Session
from typing import Optional
from datetime import datetime
import os
from api.config.settings import settings

# 确保数据目录存在
def ensure_data_directory():
    # 确保数据目录存在
    os.makedirs(settings.data_dir, exist_ok=True)
    print(f"已创建数据目录: {settings.data_dir}")
    
    # 如果使用SQLite数据库，检查数据库文件的父目录
    if settings.get_database_url.startswith('sqlite:///'):
        db_path = settings.get_database_url.replace('sqlite:///', '')
        # 获取目录路径
        dir_path = os.path.dirname(db_path)
        # 如果目录不为空且不存在，则创建目录
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
            print(f"已创建数据库目录: {dir_path}")

# 确保数据目录存在
ensure_data_directory()

# 数据库引擎
engine = create_engine(settings.get_database_url, echo=False, connect_args=settings.db_connect_args)

# 数据模型
class SMSRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    from_: str = Field(..., alias='from')
    contact_name: Optional[str]
    phone_area: Optional[str]
    sms: str
    sim_slot: Optional[str]
    sim_sub_id: Optional[str]
    device_name: Optional[str]
    receive_time: datetime
    extracted_code: Optional[str] = None
    phone_number: Optional[str] = None  # 从 sim_slot 中提取的手机号

# 创建表结构
def create_db_and_tables():
    # 确保数据目录存在
    ensure_data_directory()
    SQLModel.metadata.create_all(engine)

# 创建会话工厂
def get_session():
    with Session(engine) as session:
        yield session
