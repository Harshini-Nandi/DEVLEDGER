from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)

class AIQueryResponse(BaseModel):
    answer: str
    retrieved_facts: Dict[str, Any] = Field(default_factory=dict)
    source_documents: List[Dict[str, Any]] = Field(default_factory=list)
    model_used: str
    is_ollama_connected: bool
    execution_time_ms: float
    timestamp: str

class OllamaStatusResponse(BaseModel):
    is_connected: bool
    host: str
    current_model: str
    available_models: List[str] = Field(default_factory=list)
    version: Optional[str] = None
    error_message: Optional[str] = None
    instructions: Optional[str] = None
