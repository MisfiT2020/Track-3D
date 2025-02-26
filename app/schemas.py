from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    userid: int
    username: str
    is_sudo: bool  

    class Config:
        from_attributes = True 

class UserCreate(BaseModel):
    username: str
    email: str 
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    is_sudo: Optional[bool] = None

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class UserAdminUpdate(BaseModel):
    userid: int
    new_password: Optional[str] = None
    is_admin: Optional[bool] = None

class ProgressData(BaseModel):
    progress_report: str  

class ChangeUsername(BaseModel):
    new_username: str
