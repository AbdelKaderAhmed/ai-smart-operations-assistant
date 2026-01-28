from  backend.app.functions.base import BaseFunction
from typing import Any, Dict

class NotifyTeamFunction(BaseFunction):
    async def execute(self, team_name: str, message: str, priority: str = "normal") -> Dict[str, Any]:
        print(f"\n--- 📢 NOTIFYING TEAM ---")
        print(f"Team: {team_name}")
        print(f"Message: {message}")
        print(f"Priority: {priority}")
        print(f"--------------------------\n")
        
        return {
            "status": "success",
            "message": f"Team {team_name} has been notified with priority {priority}."
        } 