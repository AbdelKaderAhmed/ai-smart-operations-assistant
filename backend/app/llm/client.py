from groq import Groq
from backend.app.core.config import settings
import json

class AIClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.MODEL_NAME

    def get_ai_decision(self, user_input: str):
        """
        ت
        """
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "send_email",
                    "description": "Send a professional email to a specific recipient",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "recipient": {"type": "string", "description": "Email address of the recipient"},
                            "subject": {"type": "string", "description": "Subject line of the email"},
                            "content": {"type": "string", "description": "The main body/content of the email"}
                        },
                        "required": ["recipient", "subject", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "schedule_meeting",
                    "description": "Schedule a meeting in the calendar",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "The meeting title"},
                            "attendees": {"type": "array", "items": {"type": "string"}, "description": "List of emails"},
                            "start_time": {"type": "string", "description": "Time in ISO format (e.g. 2024-02-01T10:00:00)"},
                            "duration": {"type": "integer", "description": "Duration in minutes", "default": 30}
                        },
                        "required": ["title", "attendees", "start_time"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "notify_team",
                    "description": "Send an urgent notification or message to a specific team",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "team_name": {"type": "string", "description": "The name of the team (e.g. DevOps, Marketing)"},
                            "message": {"type": "string", "description": "The notification message content"},
                            "priority": {"type": "string", "enum": ["low", "normal", "high", "urgent"]}
                        },
                        "required": ["team_name", "message"]
                    }
                }
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an assistant that uses tools. Always provide valid arguments for the tools based on the user request."},
                {"role": "user", "content": user_input}
            ],
            tools=tools,
            tool_choice="auto",
            temperature=0.1 # 
        )
        return response.choices[0].message

ai_client = AIClient()