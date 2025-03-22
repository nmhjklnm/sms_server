import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime

from api.config.settings import settings

def setup_logging():
    """设置日志配置"""
    # 创建日志目录
    os.makedirs(settings.log_dir, exist_ok=True)
    
    # 设置日志文件路径
    log_file = os.path.join(settings.log_dir, f"sms_server_{datetime.now().strftime('%Y%m%d')}.log")
    
    # 设置日志级别
    log_level_name = settings.log_level.upper()
    log_level = getattr(logging, log_level_name, logging.INFO)
    
    # 配置根日志记录器
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # 清除现有处理器
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 添加控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    logger.addHandler(console_handler)
    
    # 添加文件处理器
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(log_level)
    logger.addHandler(file_handler)
    
    # 为第三方库设置更高的日志级别以减少噪音
    for module in ["uvicorn", "uvicorn.error", "fastapi"]:
        if log_level > logging.DEBUG:
            logging.getLogger(module).setLevel(logging.WARNING)
    
    logger.info(f"日志级别设置为: {log_level_name}")
    logger.info(f"日志保存在: {log_file}")
    
    return logger

def get_logger(name):
    """获取指定名称的日志记录器"""
    return logging.getLogger(name)
