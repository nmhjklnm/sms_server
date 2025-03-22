# SMS接收服务器

一个为 [SmsForwarder](https://github.com/pppscn/SmsForwarder) 提供 webhook 通道支持的服务端平台，具备实时接收短信、自动提取验证码、历史记录查询等功能。

## 核心功能

- 📥 **短信接收**：支持来自 SmsForwarder 的 webhook 消息接入
- 🔎 **验证码自动提取**：自动识别短信中的验证码
- 🗂 **历史记录查询**：支持按手机号和时间段查询
- 🔄 **实时更新**：前端自动刷新获取新消息
- 🌐 **多平台兼容**：支持 Web 界面和 API 调用

## 项目结构概览

```
sms_server
├── backend               # 后端服务
│   ├── main.py           # FastAPI 应用入口
│   ├── routes            # API 路由
│   ├── services          # 核心业务逻辑
│   ├── models            # 数据库与 Pydantic 模型
│   ├── middlewares       # 日志等中间件
│   ├── utils             # 工具模块
│   └── config            # 配置模块
├── frontend              # 前端模板和静态资源
├── data                  # 数据文件夹 (SQLite)
├── Dockerfile            # Docker 支持
├── sms_service.sh        # systemd 服务安装脚本
├── requirements.txt      # Python 依赖
└── README.md             # 项目说明
```

## 快速安装

### 方式1：本地安装运行

```bash
git clone <仓库地址>
cd sms_server
pip install -r requirements.txt
cp .env.example .env   # 并根据需要修改配置
uvicorn backend.main:app --host 0.0.0.0 --port 8322 --reload
```

### 方式2：Docker 一键部署

```bash
docker build -t sms-server .
docker run -d --name sms-server -p 8322:8322 -v $(pwd)/data:/app/data sms-server
```

### 方式3：注册为 systemd 服务

```bash
sudo bash sms_service.sh
sudo systemctl status sms-webhook.service
```

---

## 配置教程（带图示）

<img width="440" alt="Code 2025-03-23 02 40 55" src="https://github.com/user-attachments/assets/343be2c5-cc7c-4bb8-bf5f-de749af3e329" />


>  图片示例：
```
https://sms.nextmind.space/v1/sms/receive
```
以及

```
{
  "from": "{{FROM}}",
  "contact_name": "{{CONTACT_NAME}}",
  "phone_area": "{{PHONE_AREA}}",
  "sms": "{{SMS}}",
  "sim_slot": "{{CARD_SLOT}}",
  "sim_sub_id": "{{CARD_SUBID}}",
  "device_name": "{{DEVICE_NAME}}",
  "receive_time": "{{RECEIVE_TIME}}"
}
```


---

## 常用 API 示例

### 📩 接收短信

```bash
POST /v1/sms/receive
```
```json
{
  "from": "+1234567890",
  "contact_name": "验证码服务",
  "sms": "您的验证码是: 123456，请在5分钟内使用。",
  "sim_slot": "13800138000",
  "receive_time": "2023-04-01T12:00:00Z"
}
```

### 🔎 查询验证码

```bash
GET /v1/sms/code?phone_number=13800138000
```

### 🗂 获取历史记录

```bash
GET /v1/sms/history?limit=10&offset=0
```

---

## 前端界面

- 首页：`http://<你的IP>:8322/`
- 在线文档：`http://<你的IP>:8322/docs`

**前端支持功能**：
- 查看最近短信
- 按手机号快速查询验证码
- 详细查看短信内容

---

## 开发与贡献

欢迎提 issue 或 pull request，让这个项目变得更好！

## 许可证

MIT License，详情请见 LICENSE 文件。

