from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class InventoryItem(Base):
    """I track what food items Sal currently has at home."""
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)  # g, kg, pieces, tbsp, cups, L, ml, cans
    category = Column(String(30), nullable=True)  # protein, carbs, veggies, dairy, spices, fats, other

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
