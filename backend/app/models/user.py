from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, Text
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user", server_default="user")
    google_sub = Column(String(128), unique=True, nullable=True, index=True)
    
    # I store physical stats for calorie/macro calculations
    current_weight_kg = Column(Float, default=98.6)
    target_weight_kg = Column(Float, default=81.0)
    height_cm = Column(Float, default=175.0)  # 5'9"
    age = Column(Integer, default=28)
    
    # I store dietary preferences as JSON for flexibility
    dietary_preferences = Column(JSON, default=lambda: {
        "halal": True,
        "disliked_foods": ["rucola"],
        "preferred_foods": ["lettuce", "cucumber", "feta", "chicken", "eggs", "daal", "rice"],
        "cooking_style": "simple",
        "oil_free_daal": True,
    })
    
    # I store the daily targets here so the AI can update them
    daily_calorie_target = Column(Integer, default=2100)
    daily_protein_target = Column(Integer, default=190)
    daily_carb_target = Column(Integer, nullable=True)
    daily_fat_target = Column(Integer, nullable=True)
    
    # I store supplement schedule as JSON
    supplements = Column(JSON, default=lambda: {
        "morning": ["apple cider vinegar", "magnesium", "multivitamin"],
        "pre_workout": ["L-carnitine", "black coffee"],
        "post_workout": ["whey protein 30g"],
        "before_bed": ["magnesium"],
    })
    
    # I store routine preferences that the RAG system can reference
    routine_preferences = Column(JSON, default=lambda: {
        "breakfast_after_workout": True,
        "shower_buffer_minutes": 45,
        "wind_down_minutes": 30,
        "prep_overnight_oats_at_night": True,
        "wake_up_weekday": "06:30",
        "wake_up_weekend": "08:00",
        "bedtime": "22:00",
    })
    
    # I store grocery preferences
    grocery_stores = Column(JSON, default=lambda: {
        "primary": ["Lidl", "Aldi", "Denner"],
        "halal": "local halal store",
        "supplements": "Migros",
        "chicken_price": "16 CHF for 2kg boneless breast",
    })
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
