from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
 DATABASE_URL:str="sqlite:///./foodstore.db"; SECRET_KEY:str="cn7NCCZdOYGGxtPTY-7X-H4k400z9GyjT-xV5rwQW7TNqzXBTtiTdIT-IEuRwoZx"; ALGORITHM:str="HS256"; ACCESS_TOKEN_EXPIRE_MINUTES:int=30; FRONTEND_ORIGIN:str="http://localhost:5173"
 model_config=SettingsConfigDict(env_file=".env",extra="ignore")
settings=Settings()
