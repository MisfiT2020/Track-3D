import math
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import google.generativeai as genai
from app import models, auth, database  

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

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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

    db_user = db.query(models.User).filter(models.User.userid == userid).first()
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