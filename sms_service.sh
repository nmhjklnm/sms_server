#!/bin/bash

# 确保脚本以root权限运行
if [ "$(id -u)" -ne 0; then
  echo "请使用sudo运行此脚本"
  exit 1
fi

# 创建systemd服务文件
cat > /etc/systemd/system/sms-webhook.service << 'EOF'
[Unit]
Description=SMS Webhook Service
After=network.target

[Service]
User=root
WorkingDirectory=/root/project/sms_server
EnvironmentFile=-/root/project/sms_server/.env
ExecStart=/bin/bash -c "cd /root/project/sms_server && /usr/bin/poetry run python backend/main.py"
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
systemctl daemon-reload

# 启用并启动服务
systemctl enable sms-webhook.service
systemctl start sms-webhook.service

echo "SMS Webhook服务已安装并启动"
echo "查看状态: systemctl status sms-webhook.service"
echo "查看日志: journalctl -u sms-webhook.service"
echo "访问服务: http://your-server-ip:$(grep -oP 'PORT=\K[0-9]+' /root/project/sms_server/.env 2>/dev/null || echo 8322)"