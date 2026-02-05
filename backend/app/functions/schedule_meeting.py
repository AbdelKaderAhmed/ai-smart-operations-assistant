from backend.app.functions.base import BaseFunction
from typing import Any, Dict
from datetime import datetime

class ScheduleMeetingFunction(BaseFunction):
    async def execute(self, title: str = "Meeting", attendees: Any = None, start_time: str = None, duration: Any = 30, **kwargs) -> Dict[str, Any]:
        try:
            
            if attendees is None:
                attendees_list = []
            elif isinstance(attendees, str):
                attendees_list = [attendees]
            else:
                attendees_list = attendees

            meeting_time = start_time or datetime.now().isoformat()
            try:
             
                clean_time = meeting_time.replace('Z', '')
                exec_dt = datetime.fromisoformat(clean_time)
                
                
                if exec_dt.hour < 8 or exec_dt.hour >= 18:
                    print(f"🛑 [SYSTEM REJECTED] Schedule attempt at {exec_dt.hour}:00")
                    return {
                        "status": "error",
                        "message": f"Operation Blocked: {exec_dt.hour}:00 is outside secure operational hours (08:00-18:00)."
                    }
            except Exception as parse_err:
                print(f"⚠️ Warning: Time parsing failed: {parse_err}")

            # 3. معالجة المدة
            try:
                final_duration = int(duration)
            except:
                final_duration = 30

            
            print(f"\n--- 📅 EXECUTING SCHEDULE ---")
            print(f"Title: {title}")
            print(f"Verified Time: {meeting_time}")
            print(f"------------------------------\n")

            return {
                "status": "success",
                "details": f"Meeting '{title}' verified and locked in.",
                "summary": {
                    "time": meeting_time,
                    "duration": f"{final_duration} min",
                    "location": "Virtual Office"
                },
                "meeting_link": "https://meet.google.com/ops-room"
            }
        except Exception as e:
            print(f"🔴 Error in Schedule Function: {str(e)}")
            return {"status": "error", "message": str(e)}