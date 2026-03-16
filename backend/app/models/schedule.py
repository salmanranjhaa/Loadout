from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, Text, ForeignKey, Time, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class EventType(str, enum.Enum):
    ROUTINE = "routine"       # wake up, wind down, shower
    MEAL = "meal"             # breakfast, lunch, dinner, snack
    EXERCISE = "exercise"     # CrossFit, running, football, yoga, cycling
    FOCUS = "focus"           # thesis, job hunt, study
    CLASS = "class"           # university classes
    SOCIAL = "social"         # chess, free time
    WORK = "work"             # IRI and other work


class RecurrenceType(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    ONCE = "once"


class ScheduleEvent(Base):
    __tablename__ = "schedule_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # I store the event details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(SQLEnum(EventType), nullable=False)
    
    # I store the day of week (0=Monday, 6=Sunday) for recurring events
    day_of_week = Column(Integer, nullable=True)  # None for one off events
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # I store location/room info
    location = Column(String(100), nullable=True)
    
    # I handle recurrence
    recurrence = Column(SQLEnum(RecurrenceType), default=RecurrenceType.WEEKLY)
    
    # I allow specific date for one off events
    specific_date = Column(DateTime(timezone=True), nullable=True)
    
    # I store extra event data as JSON (meal details, exercise details, etc.)
    event_data = Column(JSON, default=dict)
    
    # I track if the user has modified the default schedule
    is_user_modified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ScheduleModification(Base):
    """I log every modification the user makes so the RAG system can learn patterns."""
    __tablename__ = "schedule_modifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("schedule_events.id"), nullable=True)
    
    # I store what changed
    modification_type = Column(String(50))  # "time_change", "swap_meal", "skip", "add"
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)  # I store the reason for RAG context
    
    # I generate an embedding of the modification for RAG retrieval
    embedding = Column(JSON, nullable=True)  # I store as JSON array; use pgvector in production
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
