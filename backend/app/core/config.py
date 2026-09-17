from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    b2_key_id: str = ""
    b2_application_key: str = ""
    b2_bucket_name: str = ""
    b2_endpoint_url: str = ""
    b2_region: str = "us-east-005"

    resend_api_key: str = ""
    email_from: str = "noreply@leadflow.dev"

    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
