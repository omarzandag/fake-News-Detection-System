from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import joblib
import re
from bson import ObjectId


from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

client = AsyncIOMotorClient("mongodb://localhost:27017") 
db = client["fake_news_db"]
predictions_collection = db["predictions"]


model = joblib.load("fake_news_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(news: NewsRequest):  
    clean_text = re.sub(r'\s+', ' ', news.text).strip()
    X = vectorizer.transform([clean_text])
    pred = model.predict(X)[0]
    prob = model.predict_proba(X)[0].max()

    label = "FAKE" if pred == 1 else "REAL"
    confidence = round(prob * 100, 2)

 
    record = {
        "news": clean_text[:500],
        "prediction": label,
        "confidence": confidence,
        "timestamp": datetime.utcnow()
    }
    await predictions_collection.insert_one(record)


    return {"prediction": label, "confidence": confidence}

@app.get("/history")
async def get_history():
    records = []
    cursor = predictions_collection.find().sort("timestamp", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        records.append(doc)
    return records


@app.delete("/history/{record_id}")
async def delete_history_record(record_id: str):
    try:
        obj_id = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await predictions_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted"}

@app.delete("/history")
async def delete_all_history():
    result = await predictions_collection.delete_many({})
    return {"message": f"{result.deleted_count} records deleted"}


@app.get("/analysis")
async def get_analysis():
    total = await predictions_collection.count_documents({})
    real = await predictions_collection.count_documents({"prediction": "REAL"})
    fake = await predictions_collection.count_documents({"prediction": "FAKE"})

    # Avoid division by zero
    real_pct = round((real / total) * 100, 1) if total > 0 else 0
    fake_pct = round((fake / total) * 100, 1) if total > 0 else 0

    return {
        "total": total,
        "real": real,
        "fake": fake,
        "real_percentage": real_pct,
        "fake_percentage": fake_pct
    }