import uuid

from pydantic import BaseModel, ConfigDict, EmailStr


class StudioSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    location: str = ""


class StudioLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StudioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    location: str
    plan: str
