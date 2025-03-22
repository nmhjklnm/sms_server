from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from contextlib import asynccontextmanager

from backend.routes.v1.api import router
from backend.models.sms import create_db_and_tables, ensure_data_directory
from backend.config.settings import settings
from backend.middlewares.logging_middleware import logging_middleware
from backend.utils.logger import setup_logging

# 设置日志配置
logger = setup_logging()

# 创建 lifespan 上下文管理器
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 在应用启动时执行的代码
    # 确保数据目录存在
    ensure_data_directory()
    create_db_and_tables()
    logger.info("数据库表已初始化")
    yield
    # 在应用关闭时执行的代码
    logger.info("应用已关闭")

# 创建应用
app = FastAPI(
    title=settings.app_title, 
    version=settings.app_version, 
    debug=(settings.log_level == "debug"),  # 根据log_level设置debug
    lifespan=lifespan
)

# 注册路由和中间件
app.include_router(router)
app.middleware("http")(logging_middleware)

# 配置静态文件和模板
templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "templates")
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "static")

templates = Jinja2Templates(directory=templates_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 主页路由
@app.get("/", tags=["UI"])
async def index(request: Request):
    logger.debug("访问主页路由")
    return templates.TemplateResponse("index.html", {"request": request})

# 使用该方法启动应用: uvicorn backend.main:app --host 0.0.0.0 --port 8322
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.host, port=settings.port, reload=False, log_level=settings.log_level)