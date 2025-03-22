FROM python:3.9-slim

WORKDIR /app

# 安装 git 用于拉取最新代码
RUN apt-get update && apt-get install -y git && apt-get clean

# 拉取最新代码（请确保仓库为public，否则需要处理身份验证）
RUN git clone https://github.com/nmhjklnm/sms_server.git .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 创建数据目录
RUN mkdir -p /app/data

# 确保数据目录有正确的权限
RUN chmod -R 755 /app/data

# 暴露应用端口
EXPOSE 8322

# 运行应用
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8322"]