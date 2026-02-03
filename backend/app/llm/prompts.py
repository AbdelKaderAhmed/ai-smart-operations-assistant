
SYSTEM_PROMPT = """Identity: You are the SmartOps Neural Core.
Purpose: Translate natural language into structured tool calls.
Current UTC Time: {CURRENT_TIME} 

CRITICAL RULES:
1. NEVER use conversational fillers (e.g., "Sure", "I've done that").
2. CONTEXTUAL MEMORY: Resolve pronouns (him/her/it) using chat history. Reuse previous emails/names.

TEMPORAL LOGIC & SCHEDULING (MANDATORY):
3. If the user specifies ANY future time (e.g., "in 5 minutes", "tomorrow", "at 9pm", "later"), you MUST CALL 'schedule_operation'.
4. NEVER call 'send_email' or 'schedule_meeting' directly if a time delay is mentioned.
5. When calling 'schedule_operation':
   - 'operation_type': must be either 'send_email' or 'schedule_meeting'.
   - 'execution_time': Calculate the EXACT ISO 8601 timestamp based on the 'Current Time' provided above.
   - 'parameters': Must contain ALL the arguments required for the target operation (recipient, subject, content, etc.).

Example:
User: "Email Ali in 10 minutes"
Action: Call 'schedule_operation' with execution_time set to 10 mins from now, and operation_type 'send_email'.
"""




TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send a professional email immediately",
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
            "description": "Schedule a meeting immediately",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "attendees": {"type": "array", "items": {"type": "string"}},
                    "start_time": {"type": "string", "description": "ISO 8601 format"},
                    "duration": {"type": "integer"},
                    "risk_level": {"type": "string", "enum": ["low", "high"]}
                },
                "required": ["title", "attendees", "start_time", "risk_level"]
            }
        }
    },
    {
    "type": "function",
    "function": {
        "name": "schedule_operation",
        "description": "USE THIS for ANY future tasks (e.g., 'in 5 minutes'). It wraps another operation.",
        "parameters": {
            "type": "object",
            "properties": {
                "operation_type": {"type": "string", "enum": ["send_email", "schedule_meeting"]},
                "execution_time": {"type": "string", "description": "ISO format timestamp"},
                "parameters": {
                    "type": "object", 
                    "description": "Full details for the target operation (e.g., recipient, subject, content for email)"
                }
            },
            "required": ["operation_type", "execution_time", "parameters"]
        }
    }
},
{
    "type": "function",
    "function": {
        "name": "cancel_operation",
        "description": "Cancels a previously scheduled task (email or meeting).",
        "parameters": {
            "type": "object",
            "properties": {
                "operation_type": {"type": "string", "enum": ["send_email", "schedule_meeting"]},
                "details": {"type": "string", "description": "Any identifying info like recipient or subject"}
            },
            "required": ["operation_type"]
        }
    }
}
]