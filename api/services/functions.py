from typing import Optional
import re

def extract_code_with_context(sms_content: str) -> Optional[str]:
    pattern = r'(?:验证码|auth|code)[^0-9]{0,20}(\d{4,8})'
    match = re.search(pattern, sms_content, re.IGNORECASE)
    if match:
        return match.group(1)
    fallback = re.findall(r'(\d{4,8})', sms_content)
    return fallback[0] if fallback else None

def extract_phone_from_sim_slot(sim_slot: Optional[str]) -> Optional[str]:
    if not sim_slot:
        return None
    match = re.search(r'1\d{10}', sim_slot)
    if match:
        return match.group(0)
    return None