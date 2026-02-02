import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.app.functions.base import BaseFunction
from typing import Any, Dict
from dotenv import load_dotenv

load_dotenv()

class SendEmailFunction(BaseFunction):
    """
    Real implementation for sending emails via SMTP.
    """
    
    async def execute(self, recipient: str, subject: str, content: str, **kwargs) -> Dict[str, Any]:
        # 1. Configuration - Get data from .env
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASSWORD") 
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))

        # 2. Terminal Logging
        print(f"\n--- 🚀 ATTEMPTING REAL EMAIL DISPATCH ---")
        print(f"To: {recipient}")
        print(f"Subject: {subject}")
        
        if 'risk_level' in kwargs:
            print(f"Risk Assessment: {kwargs['risk_level']}")
        print(f"-----------------------------------------\n")

        # 3. Prepare the Email Message
        message = MIMEMultipart()
        message['From'] = smtp_user
        message['To'] = recipient
        message['Subject'] = subject
        message.attach(MIMEText(content, 'plain'))

        try:
            # 4. Connect to Server and Send
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()  # Secure the connection
                server.login(smtp_user, smtp_pass)
                server.send_message(message)

            print(f"✅ SUCCESS: Email sent to {recipient}")
            
            return {
                "status": "success",
                "message": f"Verified: Email dispatched to {recipient}",
                "recipient": recipient,
                "subject": subject
            }

        except Exception as e:
            print(f"❌ SMTP ERROR: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to send email: {str(e)}"
            }