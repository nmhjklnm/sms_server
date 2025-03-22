import asyncio
from fastapi import APIRouter, HTTPException, Header, Query, Depends
from sqlmodel import Session, select
from typing import Optional, List
from datetime import datetime, timedelta

from backend.models.sms import SMSRecord, get_session
from backend.models.schema import SMSRecordCreate, ResponseWrapper
from backend.services.sms_service import (
    extract_code_with_context, 
    extract_phone_from_sim_slot,
    query_latest_code
)
from backend.config.settings import settings

# 创建API路由器
router = APIRouter(prefix="/v1/sms", tags=["sms"])

# API KEY 校验
def check_api_key(x_api_key: Optional[str] = Header(None)):
    if (x_api_key != settings.api_key):
        raise HTTPException(status_code=401, detail="Unauthorized")

# 接收短信接口
@router.post("/receive")
async def receive_sms(
    payload: SMSRecordCreate, 
    session: Session = Depends(get_session),
    x_api_key: Optional[str] = Header(None)
):
    check_api_key(x_api_key)
    
    code = extract_code_with_context(payload.sms)
    extracted_phone = extract_phone_from_sim_slot(payload.sim_slot)
    
    record_data = payload.dict()
    record = SMSRecord(**record_data, extracted_code=code, phone_number=extracted_phone)
    
    session.add(record)
    session.commit()
    
    print(f"[RECEIVED] From: {payload.from_}, Code: {code}, Time: {payload.receive_time.isoformat()}")
    return ResponseWrapper(result="ok", code="SUCCESS", message="短信接收成功").dict()

# 获取验证码接口
@router.get("/code")
async def get_sms_code(
    phone_number: str = Query(...),
    platform_keyword: Optional[str] = Query(None),
    wait_timeout: int = Query(5)
):
    end_time = datetime.utcnow() + timedelta(seconds=wait_timeout)
    while datetime.utcnow() < end_time:
        code, record = query_latest_code(phone_number, platform_keyword)
        if code:
            return ResponseWrapper(
                result="ok",
                code="SUCCESS",
                message="验证码获取成功",
                data={
                    "code": code,
                    "matched_by": "keyword" if platform_keyword else "fallback",
                    "sms_excerpt": record.sms[:50],
                    "received_time": record.receive_time.isoformat()
                }
            ).dict()
        await asyncio.sleep(1)
    return ResponseWrapper(result="not_found", code="TIMEOUT", message="验证码超时未找到").dict()

# 历史记录接口
@router.get("/history", response_model=List[SMSRecord])
async def list_sms(
    limit: int = Query(20), 
    offset: int = Query(0),
    session: Session = Depends(get_session)
):
    records = session.exec(
        select(SMSRecord).order_by(SMSRecord.receive_time.desc()).offset(offset).limit(limit)
    ).all()
    return records

# 获取单条短信详情
@router.get("/{sms_id}", response_model=SMSRecord)
async def get_sms_detail(
    sms_id: int,
    session: Session = Depends(get_session)
):
    record = session.get(SMSRecord, sms_id)
    if not record:
        raise HTTPException(status_code=404, detail="短信记录不存在")
    return record

# 删除短信记录
@router.delete("/{sms_id}")
async def delete_sms(
    sms_id: int, 
    session: Session = Depends(get_session),
    x_api_key: Optional[str] = Header(None)
):
    check_api_key(x_api_key)
    record = session.get(SMSRecord, sms_id)
    if not record:
        raise HTTPException(status_code=404, detail="短信记录不存在")
    session.delete(record)
    session.commit()
    return ResponseWrapper(result="ok", code="SUCCESS", message="短信记录已删除").dict()
