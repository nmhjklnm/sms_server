# SMS接收服务器

这是一个短信接收平台，提供强大的SMS接收服务和验证码提取功能。

## 核心功能

- **短信接收**：支持接收来自多种服务的SMS消息
- **验证码自动提取**：智能识别并提取短信中的验证码
- **历史记录查询**：方便查看已接收的所有短信
- **实时更新**：无需刷新页面即可获取最新短信
- **多平台支持**：兼容各类应用和网站的验证流程

## 项目结构

```
sms_server
├── backend
│   ├── main.py                  # FastAPI应用程序入口
│   ├── __init__.py              # 后端包初始化
│   ├── routes
│   │   ├── __init__.py          # 路由包初始化
│   │   └── v1
│   │       ├── __init__.py      # v1版本API路由模块初始化
│   │       └── api.py           # 定义SMS和验证码提取相关的API路由
│   ├── services
│   │   ├── __init__.py          # 服务包初始化
│   │   └── sms_service.py       # SMS处理服务和业务逻辑
│   ├── models
│   │   ├── __init__.py          # 模型包初始化 
│   │   ├── schema.py            # Pydantic模型定义
│   │   └── sms.py               # 数据库模型定义
│   ├── middlewares
│   │   └── logging_middleware.py # 日志中间件
│   ├── utils
│   │   ├── __init__.py          # 工具包初始化
│   │   └── logger.py            # 日志工具
│   └── config
│       ├── __init__.py          # 配置模块初始化
│       ├── settings.py          # 加载和管理应用配置
│       └── .env                 # 存储环境变量
├── frontend
│   ├── templates
│   │   ├── base.html            # 基础HTML模板
│   │   └── index.html           # 首页模板
│   └── static
│       ├── css
│       │   └── styles.css       # 应用样式
│       └── js
│           └── app.js           # 前端JavaScript逻辑
├── data                         # 数据存储目录
│   └── sms_database.db          # SQLite数据库文件
├── Dockerfile                   # Docker镜像构建文件
├── .env                         # 环境变量配置
├── .env.example                 # 环境变量示例
├── requirements.txt             # 项目依赖列表
├── sms_service.sh               # systemd服务安装脚本
└── README.md                    # 项目文档和说明
```

## 安装指南

### 方法1: 直接安装

1. 克隆仓库:
   ```
   git clone <仓库地址>
   cd sms_server
   ```

2. 安装所需依赖:
   ```
   pip install -r requirements.txt
   ```

3. 配置环境变量:
   ```
   cp .env.example .env
   # 编辑.env文件设置必要的环境变量
   ```

### 方法2: Docker安装

1. 使用 Docker 构建镜像:
   ```
   docker build -t sms-server .
   ```

2. 启动容器:
   ```
   docker run -d --name sms-server -p 8322:8322 -v ./data:/app/data sms-server
   ```

### 方法3: 使用systemd服务

1. 执行服务安装脚本:
   ```
   sudo bash sms_service.sh
   ```

2. 检查服务状态:
   ```
   sudo systemctl status sms-webhook.service
   ```

## 服务配置

您可以通过编辑 `.env` 文件来配置服务:

```
# 数据库配置
DATABASE_URL=sqlite:///data/sms_database.db

# API密钥配置 
API_KEY=your_api_key_here

# 服务器配置
HOST=0.0.0.0
PORT=8322
LOG_LEVEL=info  # 可选: debug, info, warning, error, critical
```

## 运行应用

### 方法1: 使用Python运行

在项目根目录下执行以下命令启动FastAPI应用:
```
uvicorn backend.main:app --host 0.0.0.0 --port 8322 --reload
```

### 方法2: 脚本运行

在项目根目录下执行:
```
python -m backend.main
```

应用将在配置的端口上运行（默认为 `http://0.0.0.0:8322`）。

## API使用示例

### 接收短信

```bash
curl -X POST "http://localhost:8322/v1/sms/receive" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "from": "+1234567890",
    "contact_name": "验证码服务",
    "sms": "您的验证码是: 123456，请在5分钟内使用。",
    "sim_slot": "13800138000",
    "receive_time": "2023-04-01T12:00:00Z"
  }'
```

### 查询验证码

```bash
curl "http://localhost:8322/v1/sms/code?phone_number=13800138000"
```

### 获取历史记录

```bash
curl "http://localhost:8322/v1/sms/history?limit=10&offset=0"
```

## 应用场景

- 注册新账号需要接收验证码
- 测试短信发送功能
- 需要临时手机号接收短信
- 不想泄露个人手机号
- API集成到自动化测试流程

## API文档

API文档可在`http://localhost:8322/docs`访问。

## 前端界面

前端界面可通过访问`http://localhost:8322/`使用。主要功能包括：

- 查询特定手机号的验证码
- 查看最近接收的短信记录
- 查看短信详细内容

## 贡献指南

欢迎贡献！请通过issue或提交pull request来提供改进或修复bug。

## 许可证

本项目采用MIT许可证。详情请查看LICENSE文件。