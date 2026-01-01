from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class PredictionRequest(BaseModel):
    text: str

class PredictionRecord(BaseModel):
    news: str
    confidence: float
    prediction: Literal["FAKE", "REAL"]
    timestamp: datetime = Field(default_factory=datetime.utcnow)