from pymongo import MongoClient
from app.core.config import get_settings

settings = get_settings()
client = MongoClient(settings.MONGODB_URL)
# Not finished still working on this
db = client[settings.DB_NAME]
employees_collection = db['employees']
agents_collection = db['agents']
