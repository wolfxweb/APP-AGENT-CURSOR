from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = Field(..., validation_alias="DATABASE_URL")
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        validation_alias="CORS_ORIGINS",
    )
    secret_key: str = Field(
        default="dev-change-me-use-openssl-rand-hex-32-in-real-env",
        validation_alias="SECRET_KEY",
    )
    algorithm: str = Field(default="HS256", validation_alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    cookie_name: str = Field(default="access_token", validation_alias="COOKIE_NAME")
    cookie_secure: bool = Field(default=False, validation_alias="COOKIE_SECURE")
    cookie_samesite: str = Field(default="lax", validation_alias="COOKIE_SAMESITE")

    app_url: str = Field(
        default="http://localhost:5173",
        validation_alias="APP_URL",
        description="URL pública do frontend (links em e-mails)",
    )
    password_reset_token_max_age: int = Field(
        default=86_400,
        validation_alias="PASSWORD_RESET_TOKEN_MAX_AGE",
        description="Segundos de validade do token de reset",
    )

    smtp_host: str = Field(default="", validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_user: str = Field(default="", validation_alias="SMTP_USER")
    smtp_password: str = Field(default="", validation_alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="noreply@appgetup.local", validation_alias="SMTP_FROM")
    skip_activation_license_check: bool = Field(
        default=False,
        validation_alias="SKIP_ACTIVATION_LICENSE_CHECK",
        description="Se true: aceita qualquer texto na chave e não consome linha em licenses.",
    )
    bootstrap_admin_enabled: bool = Field(
        default=False,
        validation_alias="BOOTSTRAP_ADMIN_ENABLED",
        description="Cria/atualiza admin padrão no startup (uso local/dev).",
    )
    bootstrap_admin_email: str = Field(
        default="",
        validation_alias="BOOTSTRAP_ADMIN_EMAIL",
    )
    bootstrap_admin_password: str = Field(
        default="",
        validation_alias="BOOTSTRAP_ADMIN_PASSWORD",
    )
    bootstrap_admin_name: str = Field(
        default="Administrador",
        validation_alias="BOOTSTRAP_ADMIN_NAME",
    )
    bootstrap_admin_activity_type: str = Field(
        default="Prestação de serviços",
        validation_alias="BOOTSTRAP_ADMIN_ACTIVITY_TYPE",
    )
    bootstrap_admin_whatsapp: str = Field(
        default="11999999999",
        validation_alias="BOOTSTRAP_ADMIN_WHATSAPP",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
