from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetResponse(BaseModel):
    id: int
    name: str
    filename: str
    row_count: int
    label_balance: Optional[Dict[str, int]] = None
    description: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DatasetPreview(BaseModel):
    dataset: DatasetResponse
    columns: List[str]
    preview_rows: List[dict]
