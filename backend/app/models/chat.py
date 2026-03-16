from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class ChatSession(Base):
    """I store a saved chat conversation with its messages."""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # I derive the title from the first user message (truncated)
    title = Column(String(100), nullable=False, default="Untitled")

    # I store the full message array as JSON: [{role, content}, ...]
    messages = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
