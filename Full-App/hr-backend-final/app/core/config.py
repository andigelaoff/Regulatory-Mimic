from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    MONGODB_URL: str 
    DB_NAME: str 
    OPENAI_API_KEY: str 
    AWS_REGION: str 
    COGNITO_USER_POOL_ID: str 
    COGNITO_CLIENT_ID: str 
    COGNITO_CLIENT_SECRET: str 
    S3_BUCKET_NAME: str 
    OPENSEARCH_HOST: str 
    INDEX_NAME: str 

    class Config:
        env_file = "hr-backend-final/.env"


@lru_cache()
def get_settings():
    return Settings()


