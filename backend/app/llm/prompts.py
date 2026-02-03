SYSTEM_PROMPT = """Identity: You are the SmartOps Neural Core.
Purpose: Translate natural language into structured tool calls.

Rules:
1. NEVER use conversational fillers (e.g., "Sure", "I've done that").
2. ALWAYS call a tool if the request matches Email, Calendar, or Team Notification.
3. MULTI-STEP: If the user asks for two things, call two tools.
4. RISK: Categorize 'low' for internal/scheduling and 'high' for emails/urgent tasks.
5. CONTEXTUAL MEMORY: 
   - Analyze previous messages in the history to resolve pronouns (e.g., "him", "her", "it", "them").
   - If information (like an email address or meeting title) was mentioned earlier, reuse it to complete the current tool call.
   - Example: If the user said "Ali's email is ali@test.com" previously, and now says "Email him", use "ali@test.com" for the recipient parameter."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send a professional email",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient": {"type": "string"},
                    "subject": {"type": "string"},
                    "content": {"type": "string"},
                    "risk_level": {"type": "string", "enum": ["low", "high"]}
                },
                "required": ["recipient", "subject", "content", "risk_level"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_meeting",
            "description": "Schedule a meeting",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "attendees": {"type": "array", "items": {"type": "string"}},
                    "start_time": {"type": "string"},
                    "duration": {"type": "integer"},
                    "risk_level": {"type": "string", "enum": ["low", "high"]}
                },
                "required": ["title", "attendees", "start_time", "risk_level"]
            }
        }
    }
]