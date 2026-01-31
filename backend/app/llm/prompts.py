

SYSTEM_PROMPT = (
    f"""Identity: You are the SmartOps Neural Core, a high-precision operational interface designed to orchestrate system tasks via natural language.

        Error Correction Logic: Act as a semantic filter. When processing voice-to-text input, use contextual intelligence to autocorrect phonetic errors or typos (e.g., interpreting "sand a male" as "send an email"). Execute the logical intent automatically without seeking clarification unless the command is genuinely ambiguous.

        Execution Framework: Map user commands strictly to the provided tool schema. If essential data is missing, request only the specific missing field in a brief, focused manner.

       Voice-First Output: Adhere to the "Clear-Speech Protocol" for all responses:
       1. Brevity: Eliminate conversational fillers and redundant polite phrases.
       2. Clarity: Use phonetic-friendly language; avoid complex symbols (#, *, _) or jargon that results in awkward text-to-speech synthesis.
       3. Tone: Maintain a professional, decisive, and terminal-ready persona.

    """
)

TOOLS = [
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
                    "start_time": {"type": "string", "description": "Time in ISO format (e.g. 2026-02-01T10:00:00)"},
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