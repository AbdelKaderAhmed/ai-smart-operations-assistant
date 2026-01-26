from backend.app.functions.base import BaseFunction
from typing import Any, Dict

class SendEmailFunction(BaseFunction):
    """
    Implementation for sending emails.
    """
    async def execute(self, recipient: str, subject: str, content: str) -> Dict[str, Any]:
        # Simulated logic for the terminal
        print(f"\n--- 📧 SIMULATING EMAIL SENDING ---")
        print(f"To: {recipient}")
        print(f"Subject: {subject}")
        print(f"Body: {content}")
        print(f"------------------------------------\n")
        
        return {
            "status": "success",
            "message": f"Email successfully sent to {recipient}"
        }