import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.llm.client import ai_client
from backend.app.functions.registry import FUNCTION_REGISTRY
from backend.app.db.session import get_db
from backend.app.models.operation import Operation

router = APIRouter()

class UserCommand(BaseModel):
    command: str

class ExecuteCommand(BaseModel):
    intent: str
    data: dict

@router.post("/analyze")
async def analyze_command(user_request: UserCommand, db: Session = Depends(get_db)):
    try:
        ai_message = ai_client.get_ai_decision(user_request.command)
        tool_calls = getattr(ai_message, 'tool_calls', None)

        if tool_calls:
            proposed_actions = []
            for tool_call in tool_calls:
                try:
                    
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if 'attendees' in function_args and isinstance(function_args['attendees'], str):
                        function_args['attendees'] = [function_args['attendees']]

                    proposed_actions.append({
                        "tool": tool_call.function.name,
                        "parameters": function_args
                    })
                except json.JSONDecodeError:
                    continue 

            if proposed_actions:
                
                new_op = Operation(
                    command=user_request.command,
                    intent="plan_proposed",
                    status="pending_approval",
                    
                    response_data=json.dumps(proposed_actions, ensure_ascii=False)
                )
                db.add(new_op)
                db.commit()

                return {
                    "intent": "plan_proposed",
                    "actions": proposed_actions,
                    "assistant_message": "Operation plan generated. Please approve to proceed."
                }

        content = getattr(ai_message, 'content', "").strip()
        
        
        unsupported_keywords = ["pizza", "food", "music", "weather", "buy", "shop"]
        is_out_of_scope = any(word in user_request.command.lower() for word in unsupported_keywords)

        if is_out_of_scope:
            content = f"Command '{user_request.command}' is out of scope. I am authorized only for Email and Scheduling."
            intent_type = "out_of_scope"
        else:
            intent_type = "text_response"

        
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
        print(f"🔴 Backend Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Neural Core Failure")

@router.post("/execute-confirmed")
async def execute_confirmed_command(request: ExecuteCommand, db: Session = Depends(get_db)):
    try:
        
        executor = FUNCTION_REGISTRY.get(request.intent)
        if not executor:
            raise HTTPException(status_code=400, detail=f"Executor for {request.intent} not found")

        
        result = await executor.execute(**request.data)
        
        return {
            "status": "success",
            "execution_result": result
        }
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