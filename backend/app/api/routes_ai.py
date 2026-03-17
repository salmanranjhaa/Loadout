import logging
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.meal import MealTemplate, MealLog
from app.models.inventory import InventoryItem
from app.models.schedule import ScheduleEvent
from app.models.analytics import WorkoutLog
from app.services.vertex_ai import chat_with_ai, calculate_macros_from_description
from app.services.rag import retrieve_relevant_context
from app.core.limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[list[dict]] = None
    context_type: Optional[str] = None


class MealSwapRequest(BaseModel):
    current_meal_id: int
    reason: Optional[str] = None
    preferences: Optional[str] = None


@router.post("/chat")
@limiter.limit("20/minute")
async def ai_chat(
    request: Request,
    chat: ChatMessage,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """I handle the main AI chatbot interaction with full context injection."""
    user_result = await db.execute(select(User).where(User.id == user["sub"]))
    user_profile = user_result.scalar_one_or_none()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")

    profile_dict = {
        "username": user_profile.username,
        "current_weight_kg": user_profile.current_weight_kg,
        "target_weight_kg": user_profile.target_weight_kg,
        "height_cm": user_profile.height_cm,
        "age": user_profile.age,
        "daily_calorie_target": user_profile.daily_calorie_target,
        "daily_protein_target": user_profile.daily_protein_target,
        "dietary_preferences": user_profile.dietary_preferences,
        "supplements": user_profile.supplements,
        "routine_preferences": user_profile.routine_preferences,
    }

    # I retrieve vector-similarity context from historical meal/workout/schedule data
    rag_context = await retrieve_relevant_context(
        query=chat.message,
        user_id=user["sub"],
        db=db,
        top_k=5,
    )

    # I inject today's meals so the AI knows what's been eaten
    today_meals = await db.execute(
        select(MealLog).where(
            MealLog.user_id == user["sub"],
            MealLog.date == date.today(),
        )
    )
    today_meals_list = today_meals.scalars().all()
    if today_meals_list:
        meals_lines = "\n".join([
            f"  {m.meal_type}: {m.name} ({m.calories} kcal, {m.protein_g}g protein)"
            for m in today_meals_list
        ])
        total_cal = sum(m.calories for m in today_meals_list)
        total_pro = sum(m.protein_g for m in today_meals_list)
        rag_context += (
            f"\n\nTODAY'S MEALS SO FAR ({total_cal} kcal, {total_pro}g protein):\n{meals_lines}"
        )

    # I inject today's schedule so the AI knows the day's plan
    today_weekday = (date.today().weekday())  # 0=Monday, 6=Sunday
    schedule_result = await db.execute(
        select(ScheduleEvent)
        .where(ScheduleEvent.user_id == user["sub"])
        .where(ScheduleEvent.day_of_week == today_weekday)
        .order_by(ScheduleEvent.start_time)
    )
    schedule_events = schedule_result.scalars().all()
    if schedule_events:
        sched_lines = "\n".join([
            f"  {str(e.start_time or '')[:5]}-{str(e.end_time or '')[:5]}: {e.title} ({e.event_type})"
            + (f" @ {e.location}" if e.location else "")
            for e in schedule_events
        ])
        rag_context += f"\n\nTODAY'S SCHEDULE:\n{sched_lines}"

    # I inject recent workouts so the AI can assess load, recovery, and strain
    week_ago = date.today() - timedelta(days=7)
    recent_workouts_result = await db.execute(
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user["sub"])
        .where(WorkoutLog.date >= week_ago)
        .order_by(WorkoutLog.date.desc())
        .limit(10)
    )
    recent_workouts = recent_workouts_result.scalars().all()
    if recent_workouts:
        workout_lines = "\n".join([
            f"  {w.date}: {w.workout_type} {w.duration_minutes}min, {w.intensity} intensity"
            + (f", ~{w.calories_burned} kcal burned" if w.calories_burned else "")
            + (f", energy {w.energy_level}/5" if w.energy_level else "")
            for w in recent_workouts
        ])
        rag_context += f"\n\nRECENT WORKOUTS (last 7 days):\n{workout_lines}"

    # I inject the pantry so the AI can suggest meals using available ingredients
    inventory_result = await db.execute(
        select(InventoryItem).where(InventoryItem.user_id == user["sub"])
        .order_by(InventoryItem.category, InventoryItem.name)
    )
    inventory_items = inventory_result.scalars().all()
    if inventory_items:
        inv_lines = ", ".join([
            f"{i.name}" + (f" ({i.quantity}{i.unit})" if i.quantity else "")
            for i in inventory_items
        ])
        rag_context += f"\n\nCURRENT PANTRY/INVENTORY: {inv_lines}"

    try:
        response = await chat_with_ai(
            message=chat.message,
            user_profile=profile_dict,
            conversation_history=chat.conversation_history,
            rag_context=rag_context,
        )
    except Exception as e:
        logger.error(f"Vertex AI chat failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail=f"AI service error: {type(e).__name__}: {e}")

    return {
        "reply": response["text"],
        "structured_data": response.get("structured_data"),
        "rag_context_used": bool(rag_context),
    }


@router.post("/swap-meal")
@limiter.limit("10/minute")
async def swap_meal(
    request: Request,
    body: MealSwapRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """I handle a meal swap request and suggest alternatives via AI."""
    template_result = await db.execute(
        select(MealTemplate).where(
            MealTemplate.id == body.current_meal_id,
            MealTemplate.user_id == user["sub"],
        )
    )
    current_meal = template_result.scalar_one_or_none()
    if not current_meal:
        raise HTTPException(status_code=404, detail="Meal template not found")

    user_result = await db.execute(select(User).where(User.id == user["sub"]))
    user_profile = user_result.scalar_one_or_none()

    swap_prompt = f"""The user wants to swap their current meal:
Current: {current_meal.name} ({current_meal.calories} kcal, {current_meal.protein_g}g protein)
Ingredients: {current_meal.ingredients}

User's reason: {body.reason or "wants variety"}
Preferences: {body.preferences or "similar macros, different taste"}

Suggest 2-3 alternative meals that match the macro range and are halal/Swiss-available.
Respond with a JSON array of meal suggestions using the save_meal_template format."""

    profile_dict = {
        "current_weight_kg": user_profile.current_weight_kg,
        "target_weight_kg": user_profile.target_weight_kg,
        "height_cm": user_profile.height_cm,
        "age": user_profile.age,
        "daily_calorie_target": user_profile.daily_calorie_target,
        "daily_protein_target": user_profile.daily_protein_target,
    }

    response = await chat_with_ai(message=swap_prompt, user_profile=profile_dict)

    return {
        "current_meal": {
            "id": current_meal.id,
            "name": current_meal.name,
            "calories": current_meal.calories,
            "protein_g": current_meal.protein_g,
        },
        "suggestions": response.get("structured_data") or response["text"],
    }


@router.post("/estimate-macros")
@limiter.limit("30/minute")
async def estimate_macros(
    request: Request,
    description: str,
    _user: dict = Depends(get_current_user),
):
    """I estimate macros from a free text food description using Gemini."""
    result = await calculate_macros_from_description(description)
    return result
