from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# 用于接收短信的请求模型
class SMSRecordCreate(BaseModel):
    from_: str = Field(..., alias='from')
    contact_name: Optional[str] = None
    phone_area: Optional[str] = None
    sms: str
    sim_slot: Optional[str] = None
    sim_sub_id: Optional[str] = None
    device_name: Optional[str] = None
    receive_time: datetime
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "from": "10086",
                "contact_name": "中国移动",
                "sms": "您的验证码是123456，请在5分钟内完成验证。",
                "sim_slot": "SIM1(15012345678)",
                "receive_time": "2023-03-15T14:30:00Z"
            }
        }

# 通用响应包装器
class ResponseWrapper(BaseModel):
    result: str
    code: str
    message: str
    data: Optional[Dict[str, Any]] = None
