from fastapi import Request, Response
import traceback
from api.utils.logger import get_logger

# 获取日志记录器
logger = get_logger("uvicorn.error")

async def logging_middleware(request: Request, call_next):
    # 记录请求信息
    logger.info(f"请求 {request.method} {request.url.path}")
    
    # 记录详细的请求信息（如果日志级别为DEBUG）
    if logger.level <= logging.DEBUG:
        headers_str = "\n".join([f"{k}: {v}" for k, v in request.headers.items()])
        logger.debug(f"请求 Headers: {headers_str}")
        
        body = await request.body()
        if body:
            logger.debug(f"请求 Body: {body.decode('utf-8', errors='replace')}")
        
        # 恢复请求体流，供下游消费
        async def receive():
            return {"type": "http.request", "body": body}
        request._receive = receive
    
    try:
        # 处理请求
        response = await call_next(request)
        logger.info(f"响应状态码: {response.status_code}")
        return response
    except Exception as e:
        # 记录异常信息
        error_details = traceback.format_exc()
        logger.error(f"处理请求时发生异常: {str(e)}\n{error_details}")
        # 重新抛出异常，让FastAPI处理
        raise

# 添加缺失的导入
import logging