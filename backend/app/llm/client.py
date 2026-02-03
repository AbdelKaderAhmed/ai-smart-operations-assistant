
from groq import Groq
from backend.app.core.config import settings
from .prompts import SYSTEM_PROMPT, TOOLS

class AIClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.MODEL_NAME


    def get_ai_decision(self, user_input: str, history: list = None):
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        if history:
            for msg in history[-6:]:
                role = msg.get("role")
                if role == "bot": role = "assistant"
                
                content = msg.get("content")
                
                
                if content and role in ["user", "assistant"]:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": user_input})

        
        print(f"DEBUG MESSAGES: {messages}")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.1
        )
        return response.choices[0].message

ai_client = AIClient()