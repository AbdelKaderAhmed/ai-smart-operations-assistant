from backend.app.functions.send_email import SendEmailFunction
# Note: You can create a schedule_meeting.py similarly, 
# for now we can reuse a simple logic or create a placeholder class

class ScheduleMeetingFunction:
    async def execute(self, title: str, attendees: list, start_time: str, duration: int = 30):
        print(f"--- 📅 SCHEDULING MEETING ---")
        print(f"Title: {title}")
        print(f"Time: {start_time} ({duration} min)")
        print(f"With: {', '.join(attendees)}")
        return {"status": "success", "meeting_link": "https://meet.google.com/mock-link"}

FUNCTION_REGISTRY = {
    "send_email": SendEmailFunction(),
    "schedule_meeting": ScheduleMeetingFunction()
}