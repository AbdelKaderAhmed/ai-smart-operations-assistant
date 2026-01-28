from backend.app.functions.send_email import SendEmailFunction
from backend.app.functions.schedule_meeting import ScheduleMeetingFunction
from backend.app.functions.notify_team import NotifyTeamFunction

FUNCTION_REGISTRY = {
    "send_email": SendEmailFunction(),
    "schedule_meeting": ScheduleMeetingFunction(),
    "notify_team": NotifyTeamFunction()
}