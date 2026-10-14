from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")

class AssistantChatRequest(BaseModel):
    message: str = Field(..., description="User question or prompt")
    context: Optional[Dict[str, Any]] = Field(None, description="Active review analysis context if available")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Previous conversation turns")

class AssistantChatResponse(BaseModel):
    reply: str
    suggested_prompts: List[str] = Field(default_factory=list)
    provider: str = "veridex_forensic_engine"

