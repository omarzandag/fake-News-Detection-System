from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME")

client = AsyncIOMotorClient(MONGODB_URL)
database = client[DB_NAME]
predictions_collection = database["predictions"]