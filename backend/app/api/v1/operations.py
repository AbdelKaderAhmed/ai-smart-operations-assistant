import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.llm.client import ai_client
from backend.app.functions.registry import FUNCTION_REGISTRY

router = APIRouter()

class UserCommand(BaseModel):
    command: str

@router.post("/analyze")
async def analyze_command(user_request: UserCommand):
    try:
        # 1. Get AI Decision
        ai_message = ai_client.get_ai_decision(user_request.command)
        
        # 2. Check if it's a Tool Call (Function)
        if ai_message.tool_calls:
            tool_call = ai_message.tool_calls[0]
            function_name = tool_call.function.name
            # Parse the arguments from string to dict
            function_args = json.loads(tool_call.function.arguments)
            
            # 3. Look up the function in our registry
            executor = FUNCTION_REGISTRY.get(function_name)
            
            if executor:
                # 4. Execute the actual Python code
                result = await executor.execute(**function_args)
                return {
                    "intent": "action_executed",
                    "function": function_name,
                    "execution_result": result,
                    "assistant_message": f"Successfully handled your request for {function_name}."
                }
            else:
                return {"error": f"Function {function_name} not implemented yet."}
        
        # 5. Fallback to simple text response
        return {
            "intent": "text_response",
            "content": ai_message.content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 