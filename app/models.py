import random
from datetime import datetime
from sqlalchemy import Column, Integer, Boolean, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    userid = Column(Integer, unique=True, index=True, nullable=False, default=lambda: random.randint(100000, 999999))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_sudo = Column(Boolean, default=False)
    profile_pic = Column(String, default="/static/images/avatar/1.jpg")
    joined_date = Column(DateTime, default=datetime.utcnow)  
    recent_imports = relationship("RecentImport", back_populates="user")

class RecentImport(Base):
    __tablename__ = "recent_imports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.userid"), nullable=False)
    prediction = Column(Text, nullable=False)
    chart_data = Column(Text, nullable=False)  
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="recent_imports")
