from __future__ import annotations
import random
from datetime import datetime
from typing import List

from sqlalchemy import ForeignKey, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base  

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    userid: Mapped[int] = mapped_column(
        Integer,
        unique=True,
        index=True,
        nullable=False,
        default=lambda: random.randint(100000, 999999)
    )
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_sudo: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_pic: Mapped[str] = mapped_column(String, default="/static/images/avatar/1.jpg")
    joined_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    recent_imports: Mapped[List[RecentImport]] = relationship(
        "RecentImport",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class RecentImport(Base):
    __tablename__ = "recent_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.userid"), nullable=False)
    prediction: Mapped[str] = mapped_column(Text, nullable=False)
    chart_data: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="recent_imports")
