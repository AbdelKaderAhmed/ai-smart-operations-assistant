import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import asyncio
from pytz import utc

from backend.app.llm.client import ai_client
from backend.app.functions.registry import FUNCTION_REGISTRY
from backend.app.db.session import get_db
from backend.app.models.operation import Operation
from backend.app.validation.double_check import perform_double_check

router = APIRouter()

# --- ⏰ Scheduler Setup ---
scheduler = BackgroundScheduler(timezone=utc)
scheduler.start()

def run_scheduled_task(intent, data):
    """Callback function for the background scheduler to execute tasks."""
    print(f"⏰ [TIMER TRIGGERED] Starting: {intent}")
    executor = FUNCTION_REGISTRY.get(intent)
    if executor:
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(executor.execute(**data))
            loop.close()
            print(f"✅ [SUCCESS] Scheduled operation {intent} finished.")
        except Exception as e:
            print(f"❌ [FAILED] Scheduled operation {intent}: {str(e)}")

# --- Pydantic Schemas ---
class ChatMessage(BaseModel):
    role: str
    content: str

class UserCommand(BaseModel):
    command: str
    history: Optional[List[ChatMessage]] = []  

class ExecuteCommand(BaseModel):
    intent: str
    data: dict

# --- Endpoints ---

@router.post("/analyze")
async def analyze_command(user_request: UserCommand, db: Session = Depends(get_db)):
    """Analyzes natural language input, detects intent, and proposes a validated plan."""
    try:
        ai_message = ai_client.get_ai_decision(
            user_request.command, 
            history=[msg.dict() for msg in user_request.history]
        )
        
        tool_calls = getattr(ai_message, 'tool_calls', None)

        if tool_calls:
            raw_actions = []
            for tool_call in tool_calls:
                try:
                    function_args = json.loads(tool_call.function.arguments)
                    if 'attendees' in function_args and isinstance(function_args['attendees'], str):
                        function_args['attendees'] = [function_args['attendees']]

                    raw_actions.append({
                        "tool": tool_call.function.name,
                        "parameters": function_args
                    })
                except json.JSONDecodeError:
                    continue 

            proposed_actions = await perform_double_check(raw_actions)

            if proposed_actions:
                has_critical_error = any(not action["validation"]["valid"] for action in proposed_actions)
                status = "pending_approval" if not has_critical_error else "validation_failed"
                msg = "Sequence ready for deployment." if not has_critical_error else "Validation alert: Some actions require correction."

                new_op = Operation(
                    command=user_request.command,
                    intent="plan_proposed",
                    status=status,
                    response_data=json.dumps(proposed_actions, ensure_ascii=False)
                )
                db.add(new_op)
                db.commit()

                return {
                    "intent": "plan_proposed",
                    "actions": proposed_actions,
                    "assistant_message": msg,
                    "validation_status": "clear" if not has_critical_error else "flagged"
                }

        content = getattr(ai_message, 'content', "").strip()
        intent_type = "text_response"
        
        unsupported_keywords = ["pizza", "food", "music", "weather", "buy", "shop"]
        if any(word in user_request.command.lower() for word in unsupported_keywords):
            content = f"Command '{user_request.command}' is out of scope."
            intent_type = "out_of_scope"

        new_op = Operation(
            command=user_request.command,
            intent=intent_type,
            status="info",
            response_data=json.dumps({"message": content})
        )
        db.add(new_op)
        db.commit()

        return {
            "intent": intent_type,
            "assistant_message": content,
            "actions": []
        }
    except Exception as e:
        db.rollback()
        print(f"🔴 Backend Analysis Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Neural Core Failure")

@router.post("/execute-confirmed")
async def execute_confirmed_command(request: ExecuteCommand, db: Session = Depends(get_db)):
    """Executes validated actions with smart suggestions for security violations."""
    try:
        if request.intent == "schedule_operation":
            job_data = request.data
            exec_time_str = job_data.get("execution_time")
            
            try:
                exec_time = datetime.fromisoformat(exec_time_str.replace('Z', '+00:00'))
                
                # --- 🛡️ Smart Guardrail: Operational Hours (08:00 - 18:00) ---
                if exec_time.hour < 8 or exec_time.hour >= 18:
                    # Logic: Suggest 08:00 AM of the same day
                    suggested_time = exec_time.replace(hour=8, minute=0, second=0)
                    
                    # Returning a structured error for the Frontend to handle
                    raise HTTPException(
                        status_code=400, 
                        detail={
                            "error_type": "SECURITY_VIOLATION",
                            "message": f"Time {exec_time.hour}:00 is outside operational hours.",
                            "suggestion": suggested_time.isoformat()
                        }
                    )
                
                target_intent = job_data.get("operation_type")
                target_params = job_data.get("parameters")
                job_id = f"{target_intent}_{target_params.get('recipient', 'task')}"

                scheduler.add_job(
                    run_scheduled_task,
                    'date',
                    run_date=exec_time,
                    args=[target_intent, target_params],
                    id=job_id,
                    replace_existing=True
                )
                
                return {
                    "status": "scheduled",
                    "message": f"Operation queued for {exec_time_str}",
                    "execution_result": {"details": f"Job ID: {job_id} locked."}
                }
            except HTTPException:
                raise # Re-raise security violations
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid timestamp format")
            except Exception as sched_err:
                raise HTTPException(status_code=400, detail=f"Scheduling failed: {str(sched_err)}")

        if request.intent == "cancel_operation":
            target_type = request.data.get("operation_type")
            jobs = scheduler.get_jobs()
            cancelled_count = 0
            for job in jobs:
                if target_type in job.id:
                    scheduler.remove_job(job.id)
                    cancelled_count += 1
            
            if cancelled_count > 0:
                return {"status": "success", "message": f"Terminated {cancelled_count} scheduled tasks."}
            else:
                raise HTTPException(status_code=404, detail="No matching tasks found to cancel.")

        executor = FUNCTION_REGISTRY.get(request.intent)
        if not executor:
            raise HTTPException(status_code=400, detail=f"Executor for {request.intent} not found")

        result = await executor.execute(**request.data)
        return {"status": "success", "execution_result": result}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"🔴 Execution Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_operations_history(db: Session = Depends(get_db), limit: int = 15):
    return db.query(Operation).order_by(Operation.created_at.desc()).limit(limit).all()

@router.delete("/{op_id}")
async def delete_operation(op_id: int, db: Session = Depends(get_db)):
    operation = db.query(Operation).filter(Operation.id == op_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(operation)
    db.commit()
    return {"status": "deleted"}