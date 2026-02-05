from datetime import datetime
from typing import List, Dict, Any

class BusinessRuleValidator:
    
    @staticmethod
    async def validate_email_op(params: Dict[str, Any]) -> Dict[str, Any]:
        errors = []
        recipient = params.get("recipient", "")
        
        if "@" not in recipient or "." not in recipient:
            errors.append(f"Invalid email format: {recipient}")
            
        blocked_domains = ["temporary-mail.com", "spam.org"]
        if any(domain in recipient for domain in blocked_domains):
            errors.append("Recipient domain is in the blacklist.")
            
        return {"valid": len(errors) == 0, "errors": errors}

    @staticmethod
    async def validate_meeting_op(action: Dict[str, Any]) -> Dict[str, Any]:
        errors = []
        params = action.get("parameters", {})
        
        # 🆕 التحديث هنا: البحث عن start_time ليتوافق مع schedule_meeting.py
        # والبحث أيضاً في المستويات المتداخلة لضمان أقصى حماية
        execution_time = (
            params.get("start_time") or 
            params.get("execution_time") or 
            params.get("parameters", {}).get("start_time")
        )
        
        if execution_time:
            try:
                # تنظيف الصيغة وتحويلها
                dt_str = str(execution_time).replace('Z', '')
                exec_dt = datetime.fromisoformat(dt_str)
                
                # 🚨 فحص ساعات العمل (08:00 إلى 18:00)
                if exec_dt.hour < 8 or exec_dt.hour >= 18:
                    errors.append(f"Security Alert: {exec_dt.hour}:00 is outside operational hours (08:00-18:00).")
            except Exception as e:
                errors.append(f"Invalid timestamp format: {str(e)}")
        else:
            errors.append("Missing start_time for scheduling.")

        return {"valid": len(errors) == 0, "errors": errors}

async def perform_double_check(actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    validated_actions = []
    
    for action in actions:
        tool = action.get("tool")
        params = action.get("parameters", {})
        
        check_result = {"valid": True, "errors": []}
        
        if tool == "send_email":
            check_result = await BusinessRuleValidator.validate_email_op(params)
        elif tool == "schedule_meeting":
            # نمرر الـ action كاملاً لضمان وصول المدقق لكل الحقول
            check_result = await BusinessRuleValidator.validate_meeting_op(action)
            
        action["validation"] = check_result
        validated_actions.append(action)
        
    return validated_actions