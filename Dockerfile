FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 创建数据目录
RUN mkdir -p /app/data

# 复制应用代码
COPY . .

# 确保数据目录有正确的权限
RUN chmod -R 755 /app/data

# 暴露应用端口
EXPOSE 8322

# 运行应用
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8322"]
