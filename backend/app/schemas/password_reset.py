from pydantic import BaseModel, EmailStr, Field, model_validator


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    token: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordBody":
        if self.new_password != self.confirm_password:
            raise ValueError("As senhas não coincidem")
        return self
