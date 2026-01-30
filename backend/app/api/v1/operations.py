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

@router.post("/analyze")
async def analyze_command(user_request: UserCommand, db: Session = Depends(get_db)):
    try:
        
        ai_message = ai_client.get_ai_decision(user_request.command)
        
        if not ai_message:
            raise Exception("AI returned an empty response")

        
        tool_calls = getattr(ai_message, 'tool_calls', None)

        if tool_calls:
            tool_call = tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            
            executor = FUNCTION_REGISTRY.get(function_name)
            
            if executor:
                
                result = await executor.execute(**function_args)
                
                
                new_op = Operation(
                    command=user_request.command,
                    intent=function_name,
                    status="success",
                    response_data=result
                )
                db.add(new_op)
                db.commit()
                # ----------------------------------------

                return {
                    "intent": "action_executed",
                    "function": function_name,
                    "execution_result": result,
                    "assistant_message": f"Operation {function_name} completed successfully."
                }
            else:
                return {"error": f"Function {function_name} is registered in AI but not in Backend registry."}
        
        
        content = getattr(ai_message, 'content', "I couldn't process that request.")
        
        
        new_op = Operation(
            command=user_request.command,
            intent="text_response",
            status="success",
            response_data={"message": content}
        )
        db.add(new_op)
        db.commit()

        return {
            "intent": "text_response",
            "assistant_message": content
        }
        
    except Exception as e:
        print(f"🔴 Backend Error: {str(e)}")
        
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_operations_history(db: Session = Depends(get_db), limit: int = 10):
    operations = db.query(Operation).order_by(Operation.created_at.desc()).limit(limit).all()
    return operations

@router.delete("/{op_id}")
async def delete_operation(op_id: int, db: Session = Depends(get_db)):
    operation = db.query(Operation).filter(Operation.id == op_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    db.delete(operation)
    db.commit()
    return {"message": f"Operation {op_id} deleted successfully"}