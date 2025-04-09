import math
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import google.generativeai as genai
from api import models, auth  
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.database import AsyncSessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 65536,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-thinking-exp-01-21",
    generation_config=generation_config,
)

def sanitize_nans(data):
    if isinstance(data, dict):
        return {k: sanitize_nans(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_nans(item) for item in data]
    elif isinstance(data, float) and math.isnan(data):
        return None  
    return data

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> models.User:
    # Decode and validate token
    payload = auth.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    userid = payload.get("userid")
    if not userid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Missing user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Async DB lookup
    result = await db.execute(
        select(models.User).where(models.User.userid == userid)
    )
    db_user = result.scalars().first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return db_user

def require_sudo(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_sudo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admins only"
        )
    return current_user