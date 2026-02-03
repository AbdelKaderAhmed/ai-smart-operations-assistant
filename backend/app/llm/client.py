from groq import Groq
from datetime import datetime, timezone
from backend.app.core.config import settings
from .prompts import SYSTEM_PROMPT, TOOLS

class AIClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.MODEL_NAME

    def get_ai_decision(self, user_input: str, history: list = None):
    
        current_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        
       
        dynamic_prompt = SYSTEM_PROMPT.format(CURRENT_TIME=current_utc)
        
        messages = [{"role": "system", "content": dynamic_prompt}]
        
        if history:
            for msg in history[-6:]:
                role = msg.get("role")
                if role == "bot": role = "assistant"
                content = msg.get("content")
                if content and role in ["user", "assistant"]:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": user_input})

        
        print(f"🕒 Sending to AI - Current UTC: {current_utc}")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.1
        )
        return response.choices[0].message

ai_client = AIClient()