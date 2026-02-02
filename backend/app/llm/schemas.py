from pydantic import BaseModel, Field
from typing import List, Optional, Union, Literal


class EmailAction(BaseModel):
    tool: Literal["send_email"] = "send_email"
    recipient: str = Field(..., description="Email address")
    subject: str = Field(..., description="Professional subject line")
    content: str = Field(..., description="The body content")
    risk_level: str = "medium" 

class MeetingAction(BaseModel):
    tool: Literal["schedule_meeting"] = "schedule_meeting"
    title: str = Field(..., description="Meeting title")
    attendees: List[str]
    start_time: str = Field(..., description="ISO 8601 format")
    duration: int = 30
    risk_level: str = "low"


class ActionPlan(BaseModel):
    """
    This is the ONLY output allowed from the LLM.
    It forces the Brain to think in terms of a list of actions.
    """
    thought_process: str = Field(..., description="Brief explanation of why these actions were chosen")
    actions: List[Union[EmailAction, MeetingAction]] = Field(..., description="List of validated operations to perform")


class OperationResult(BaseModel):
    plan: ActionPlan
    requires_approval: bool = True
    system_validation: str = "pending"