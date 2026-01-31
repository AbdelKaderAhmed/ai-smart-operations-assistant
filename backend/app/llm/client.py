# backend/app/llm/client.py

from groq import Groq
from backend.app.core.config import settings
from .prompts import SYSTEM_PROMPT, TOOLS

class AIClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.MODEL_NAME

    def get_ai_decision(self, user_input: str):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_input}
            ],
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.1
        )
        return response.choices[0].message

ai_client = AIClient()