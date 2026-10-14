from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import generate_assistant_reply

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(request: AssistantChatRequest):
    """
    Chat with the Veridex AI Forensic Assistant.
    Supports contextual analysis of currently inspected reviews.
    """
    try:
        response = await generate_assistant_reply(
            message=request.message,
            context=request.context,
            history=request.history
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Assistant error: {str(e)}")

