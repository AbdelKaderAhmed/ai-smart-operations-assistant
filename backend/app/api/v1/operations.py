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
        
        
        if not ai_message:
            raise Exception("AI returned an empty response")

        # 2. Check if it's a Tool Call (Safe Check)
       
        tool_calls = getattr(ai_message, 'tool_calls', None)

        if tool_calls:
            tool_call = tool_calls[0]
            function_name = tool_call.function.name
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
                    "assistant_message": f"Operation {function_name} completed successfully."
                }
            else:
                return {"error": f"Function {function_name} is registered in AI but not in Backend registry."}
        
        # 5. Fallback to simple text response
        content = getattr(ai_message, 'content', "I couldn't process that request.")
        return {
            "intent": "text_response",
            "assistant_message": content
        }
        
    except Exception as e:
        
        print(f"🔴 Backend Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))