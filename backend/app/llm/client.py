from groq import Groq
from backend.app.core.config import settings
from backend.app.llm.schemas import EmailRequest, MeetingRequest
import json

class AIClient:
    def __init__(self):
        # Access the API key directly from settings object
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.MODEL_NAME

    def get_ai_decision(self, user_input: str):
        """
        Executes a call to Groq API to decide which operation to perform.
        """
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "send_email",
                    "description": "Send a professional email",
                    "parameters": EmailRequest.model_json_schema()
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "schedule_meeting",
                    "description": "Schedule a meeting in the calendar",
                    "parameters": MeetingRequest.model_json_schema()
                }
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an AI assistant. Use tools to help with operations."},
                {"role": "user", "content": user_input}
            ],
            tools=tools,
            tool_choice="auto"
        )
        return response.choices[0].message

ai_client = AIClient()