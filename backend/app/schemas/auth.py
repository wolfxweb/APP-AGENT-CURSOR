from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

GenderOpt = Literal["Masculino", "Feminino", "Prefiro não informar"]

ActivityType = Literal[
    "Alimentação fora do Lar",
    "Comércio atacadista",
    "Comércio varejista",
    "Indústria",
    "Prestação de serviços",
]


class RegisterBody(BaseModel):
    """Cadastro com chave de ativação — setor/ramo/CEP como no fluxo legado (Jinja)."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Primeiro nome ou apelido",
    )
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    terms_accepted: bool
    activation_key: str = Field(..., min_length=1, max_length=64)
    activity_type: ActivityType
    specialty_area: str = Field(..., min_length=1, max_length=255)
    cep: str = Field(..., min_length=8, max_length=9)

    whatsapp: str | None = Field(default=None, max_length=64)

    gender: GenderOpt | None = None
    birth_day: int | None = Field(None, ge=1, le=31)
    birth_month: int | None = Field(None, ge=1, le=12)
    married: bool | None = None
    children: int | None = Field(None, ge=0)
    grandchildren: int | None = Field(None, ge=0)
    street: str | None = None
    neighborhood: str | None = None
    state: str | None = Field(None, max_length=4)
    city: str | None = None
    complement: str | None = None

    @field_validator("activation_key", mode="before")
    @classmethod
    def normalize_activation_key(cls, v: object) -> str:
        s = str(v).strip()
        if not s:
            raise ValueError("Informe a chave de ativação")
        return s

    @field_validator("cep", mode="before")
    @classmethod
    def normalize_cep(cls, v: object) -> str:
        raw = str(v).strip()
        digits = "".join(c for c in raw if c.isdigit())
        if len(digits) != 8:
            raise ValueError("Informe um CEP válido (8 dígitos)")
        return digits

    @field_validator("whatsapp")
    @classmethod
    def whatsapp_if_present(cls, v: str | None) -> str | None:
        if v is None or str(v).strip() == "":
            return None
        w = str(v).strip()
        if len(w) < 8:
            raise ValueError("WhatsApp inválido")
        return w

    @field_validator("terms_accepted")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Aceite os termos para continuar")
        return v


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class OnboardingBody(BaseModel):
    ideal_profit_margin: float | None = Field(None, ge=0, le=100)
    service_capacity: str | None = Field(None, max_length=512)
