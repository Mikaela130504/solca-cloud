from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from solca_common.security import DEMO_USERS, create_token


app = FastAPI(title="SOLCA Auth Service", version="1.0.0")


class LoginRequest(BaseModel):
    username: str
    password: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth-service"}


@app.post("/auth/login")
def login(payload: LoginRequest):
    user = DEMO_USERS.get(payload.username)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    token = create_token(payload.username, user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}

