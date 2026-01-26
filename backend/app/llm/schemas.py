from pydantic import BaseModel, Field
from typing import List, Optional

class EmailRequest(BaseModel):
    """
    Schema for sending professional emails to team members or clients.
    """
    recipient: str = Field(..., description="The recipient's email address")
    subject: str = Field(..., description="The subject line of the email")
    content: str = Field(..., description="The main body content of the email")

class MeetingRequest(BaseModel):
    """
    Schema for scheduling a new meeting in the calendar.
    """
    title: str = Field(..., description="The purpose or title of the meeting")
    attendees: List[str] = Field(..., description="List of email addresses of the participants")
    start_time: str = Field(..., description="The ISO format date and time (e.g., 2026-02-01T10:00:00)")
    duration: int = Field(default=30, description="Meeting duration in minutes")

class AIResponse(BaseModel):
    """
    General response wrapper for AI operations.
    """
    action_taken: str
    status: str = "success"
    details: Optional[dict] = None