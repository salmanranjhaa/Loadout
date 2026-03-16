from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, Text, ForeignKey, Date
from sqlalchemy.sql import func
from app.core.database import Base


class MealTemplate(Base):
    """I store the base meal templates that the user rotates between."""
    __tablename__ = "meal_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    
    # I store full nutritional breakdown
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    
    # I store ingredients as a structured list
    ingredients = Column(JSON, nullable=False)
    # Example: [{"name": "chicken breast", "amount_g": 150, "calories": 165, "protein": 31}]
    
    # I store prep instructions
    prep_instructions = Column(Text, nullable=True)
    prep_time_minutes = Column(Integer, nullable=True)
    
    # I flag whether the AI suggested this or the user created it
    source = Column(String(20), default="default")  # "default", "user", "ai_suggested"
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MealLog(Base):
    """I log every meal the user actually eats for analytics."""
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    date = Column(Date, nullable=False)
    meal_type = Column(String(20), nullable=False)
    
    # I reference the template if used, or allow custom entries
    template_id = Column(Integer, ForeignKey("meal_templates.id"), nullable=True)
    
    # I always store the actual macros consumed
    name = Column(String(200), nullable=False)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    
    # I store custom ingredients if the user modified the meal
    custom_ingredients = Column(JSON, nullable=True)
    
    # I store notes (e.g., "felt good after this", "too heavy before workout")
    notes = Column(Text, nullable=True)
    
    # I generate embedding for RAG so the AI can reference eating patterns
    embedding = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GroceryList(Base):
    """I generate weekly grocery lists based on the meal plan."""
    __tablename__ = "grocery_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    week_start = Column(Date, nullable=False)
    
    # I store items grouped by store
    items = Column(JSON, nullable=False)
    # Example: {"Lidl": [{"item": "Greek yogurt", "qty": "2x500g", "est_price": 4.0}]}
    
    estimated_total = Column(Float, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
