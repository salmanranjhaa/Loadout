from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/user", tags=["user"])


class UserProfileUpdate(BaseModel):
    current_weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    daily_calorie_target: Optional[int] = None
    daily_protein_target: Optional[int] = None


@router.get("/profile")
async def get_profile(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """I return the current user's profile including targets and supplement schedule."""
    result = await db.execute(select(User).where(User.id == user["sub"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "current_weight_kg": u.current_weight_kg,
        "target_weight_kg": u.target_weight_kg,
        "height_cm": u.height_cm,
        "age": u.age,
        "daily_calorie_target": u.daily_calorie_target,
        "daily_protein_target": u.daily_protein_target,
        "supplements": u.supplements,
        "dietary_preferences": u.dietary_preferences,
    }


@router.put("/profile")
async def update_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """I update physical stats and daily targets for the current user."""
    result = await db.execute(select(User).where(User.id == user["sub"]))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if body.current_weight_kg is not None: u.current_weight_kg = body.current_weight_kg
    if body.target_weight_kg is not None: u.target_weight_kg = body.target_weight_kg
    if body.height_cm is not None: u.height_cm = body.height_cm
    if body.age is not None: u.age = body.age
    if body.daily_calorie_target is not None: u.daily_calorie_target = body.daily_calorie_target
    if body.daily_protein_target is not None: u.daily_protein_target = body.daily_protein_target
    await db.commit()
    await db.refresh(u)
    return {"updated": True, "username": u.username}
