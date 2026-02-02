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

            
            try:
                final_duration = int(duration)
            except:
                final_duration = 30

           
            meeting_time = start_time or datetime.now().isoformat()
            
            print(f"\n--- 📅 EXECUTING SCHEDULE ---")
            print(f"Title: {title}")
            print(f"Attendees: {attendees_list}")
            print(f"------------------------------\n")

            return {
                "status": "success",
                "details": f"Meeting '{title}' scheduled.",
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