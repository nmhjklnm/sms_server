import re
from typing import Optional, Tuple
from datetime import datetime, timedelta
from sqlmodel import select, Session

from backend.models.sms import SMSRecord, engine

def extract_code_with_context(sms_content: str) -> Optional[str]:
    """从短信内容中提取验证码"""
    pattern = r'(?:验证码|auth|code)[^0-9]{0,20}(\d{4,8})'
    match = re.search(pattern, sms_content, re.IGNORECASE)
    if match:
        return match.group(1)
    fallback = re.findall(r'(\d{4,8})', sms_content)
    return fallback[0] if fallback else None

def extract_phone_from_sim_slot(sim_slot: Optional[str]) -> Optional[str]:
    """从SIM卡信息中提取手机号"""
    if not sim_slot:
        return None
    # 尝试提取11位手机号
    match = re.search(r'1\d{10}', sim_slot)
    if match:
        return match.group(0)
    return None

def query_latest_code(phone_number: str, platform_keyword: Optional[str]) -> Tuple[Optional[str], Optional[SMSRecord]]:
    """查询最新的验证码"""
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    
    with Session(engine) as session:
        query = select(SMSRecord).where(
            SMSRecord.receive_time >= ten_minutes_ago
        )
        

        primary_query = query.where(SMSRecord.phone_number == phone_number)
        if platform_keyword:
            primary_query = primary_query.where(SMSRecord.sms.contains(platform_keyword))
        
        primary_records = session.exec(primary_query.order_by(SMSRecord.receive_time.desc()).limit(5)).all()
        
        if not primary_records:
            fallback_query = query.where(SMSRecord.sim_slot.contains(phone_number))
            if platform_keyword:
                fallback_query = fallback_query.where(SMSRecord.sms.contains(platform_keyword))
            
            primary_records = session.exec(fallback_query.order_by(SMSRecord.receive_time.desc()).limit(5)).all()
        
        for record in primary_records:
            if record.extracted_code:
                return record.extracted_code, record
        
        return None, None
