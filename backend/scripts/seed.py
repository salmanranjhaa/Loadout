"""
I seed the database with the default schedule, meal templates, and user profile.
Run this once after initial migration: python -m scripts.seed
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import time
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import get_settings
from app.core.database import Base
from app.core.auth import hash_password
from app.models.user import User
from app.models.schedule import ScheduleEvent, EventType, RecurrenceType
from app.models.meal import MealTemplate
from app.services.meal_planner import DEFAULT_MEALS

settings = get_settings()

# I define the complete weekly schedule with corrected timings
# Key changes: breakfast AFTER workout + 45 min buffer, IRI blocks added
SCHEDULE_SEED = [
    # ===== MONDAY (day_of_week=0) =====
    # CrossFit is evening, so normal morning
    {"day": 0, "start": "06:30", "end": "06:45", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin, glass of water"}},
    {"day": 0, "start": "06:45", "end": "07:00", "title": "Light Stretch (15 min)", "type": "exercise",
     "meta": {"detail": "Hip flexors, hamstrings, shoulders. No workout today morning so light mobility only."}},
    {"day": 0, "start": "07:00", "end": "07:30", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "50g oats, 150g Greek yogurt, 150ml milk, chia, banana, berries. ~400 kcal, 25g protein."}},
    {"day": 0, "start": "08:00", "end": "10:00", "title": "THESIS DEEP WORK", "type": "focus",
     "meta": {"detail": "Most important block. Phone off. No emails."}},
    {"day": 0, "start": "10:15", "end": "12:00", "title": "Hacking Lab", "type": "class",
     "meta": {"detail": "Room 01-103", "location": "01-103"}},
    {"day": 0, "start": "12:15", "end": "12:45", "title": "Lunch: Chicken Salad", "type": "meal",
     "meta": {"detail": "150g grilled chicken, lettuce, cucumber, tomato, 30g feta, lemon. ~350 kcal, 42g protein."}},
    {"day": 0, "start": "13:00", "end": "15:00", "title": "IRI Work", "type": "work",
     "meta": {"detail": "IRI tasks, emails, deliverables. Blocks from calendar: 1pm to 5pm range."}},
    {"day": 0, "start": "15:00", "end": "16:30", "title": "JOB HUNT", "type": "focus",
     "meta": {"detail": "Applications, networking, LinkedIn, cover letters, interview prep."}},
    {"day": 0, "start": "16:30", "end": "17:00", "title": "Pre Workout Snack", "type": "meal",
     "meta": {"detail": "Apple + L-carnitine + black coffee. ~95 kcal."}},
    {"day": 0, "start": "17:30", "end": "18:30", "title": "CrossFit", "type": "exercise",
     "meta": {"detail": "Evening session."}},
    {"day": 0, "start": "18:30", "end": "19:00", "title": "Shower + Quick Bite", "type": "routine",
     "meta": {"detail": "Post workout protein shake (30g whey). Quick shower before chess."}},
    {"day": 0, "start": "19:00", "end": "21:00", "title": "Chess Club", "type": "social",
     "meta": {"detail": "Weekly chess session."}},
    {"day": 0, "start": "21:00", "end": "21:30", "title": "Dinner: Boiled Eggs + Salad", "type": "meal",
     "meta": {"detail": "3 boiled eggs, lettuce, cucumber, feta. ~310 kcal, 24g protein. Light post chess."}},
    {"day": 0, "start": "21:30", "end": "22:00", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "No screens. Prep overnight oats for tomorrow. Magnesium before sleep."}},

    # ===== TUESDAY (day_of_week=1) =====
    # Running morning, so breakfast AFTER run + shower
    {"day": 1, "start": "06:15", "end": "06:30", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin. L-carnitine + black coffee before run."}},
    {"day": 1, "start": "06:45", "end": "07:30", "title": "RUNNING (Hilly Route)", "type": "exercise",
     "meta": {"detail": "30-40 min easy/moderate pace. St. Gallen hills."}},
    {"day": 1, "start": "07:30", "end": "08:15", "title": "Shower + Get Ready", "type": "routine",
     "meta": {"detail": "45 min buffer. Shower, get dressed, settle in."}},
    {"day": 1, "start": "08:15", "end": "08:45", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "Prepped last night. Eat after shower. ~400 kcal, 25g protein."}},
    {"day": 1, "start": "09:00", "end": "12:00", "title": "THESIS DEEP WORK", "type": "focus",
     "meta": {"detail": "Big 3 hour block. Post run focus."}},
    {"day": 1, "start": "12:00", "end": "12:30", "title": "Lunch: Daal Chawal", "type": "meal",
     "meta": {"detail": "150g rice, 200g red lentil daal (no oil), cucumber. ~380 kcal, 18g protein."}},
    {"day": 1, "start": "12:30", "end": "13:30", "title": "Yoga Vinyasa", "type": "exercise",
     "meta": {"detail": "Great for recovery and mobility post run."}},
    {"day": 1, "start": "14:15", "end": "15:45", "title": "Football", "type": "exercise",
     "meta": {"detail": "Good cardio session."}},
    {"day": 1, "start": "16:00", "end": "17:30", "title": "German Study / Course Prep", "type": "focus",
     "meta": {"detail": "Vocab review, grammar exercises, prep for Thursday class."}},
    {"day": 1, "start": "17:30", "end": "18:00", "title": "Snack", "type": "meal",
     "meta": {"detail": "Rice cakes + Quark. ~160 kcal, 15g protein."}},
    {"day": 1, "start": "18:00", "end": "19:30", "title": "JOB HUNT", "type": "focus",
     "meta": {"detail": "Applications, follow ups, networking."}},
    {"day": 1, "start": "19:30", "end": "20:00", "title": "Dinner: Egg Scramble", "type": "meal",
     "meta": {"detail": "3 eggs with tomato, spinach, side salad. ~280 kcal, 22g protein."}},
    {"day": 1, "start": "21:30", "end": "22:00", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "Prep overnight oats. Magnesium. No screens."}},

    # ===== WEDNESDAY (day_of_week=2) =====
    # CrossFit morning, so breakfast AFTER CrossFit + shower
    {"day": 2, "start": "06:15", "end": "06:30", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin. L-carnitine + black coffee."}},
    {"day": 2, "start": "06:30", "end": "07:15", "title": "Travel to CrossFit", "type": "routine",
     "meta": {"detail": "Get ready, commute to box."}},
    {"day": 2, "start": "08:00", "end": "09:00", "title": "CrossFit", "type": "exercise",
     "meta": {"detail": "Morning session."}},
    {"day": 2, "start": "09:00", "end": "09:45", "title": "Shower + Get Ready", "type": "routine",
     "meta": {"detail": "45 min buffer. Post workout protein shake during this time."}},
    {"day": 2, "start": "09:45", "end": "10:15", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "After shower. ~400 kcal, 25g protein. Plus protein shake = 530 kcal, 55g protein so far."}},
    {"day": 2, "start": "10:00", "end": "14:00", "title": "IRI Work", "type": "work",
     "meta": {"detail": "IRI block from calendar (10am to 2pm)."}},
    {"day": 2, "start": "14:00", "end": "14:30", "title": "Lunch: Chicken Salad", "type": "meal",
     "meta": {"detail": "150g chicken, salad, feta, lemon. ~350 kcal, 42g protein."}},
    {"day": 2, "start": "14:30", "end": "16:30", "title": "THESIS DEEP WORK", "type": "focus",
     "meta": {"detail": "Afternoon thesis block."}},
    {"day": 2, "start": "16:30", "end": "17:00", "title": "Snack", "type": "meal",
     "meta": {"detail": "Banana + handful of mixed nuts (20g). ~200 kcal."}},
    {"day": 2, "start": "17:00", "end": "18:30", "title": "JOB HUNT", "type": "focus",
     "meta": {"detail": "Applications, networking."}},
    {"day": 2, "start": "19:00", "end": "19:30", "title": "Dinner: Daal Chawal (Channa)", "type": "meal",
     "meta": {"detail": "150g rice, 200g channa daal. Cucumber. ~400 kcal, 22g protein."}},
    {"day": 2, "start": "21:30", "end": "22:00", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "Prep overnight oats. Magnesium."}},

    # ===== THURSDAY (day_of_week=3) =====
    # Running morning, breakfast after run + shower
    {"day": 3, "start": "06:15", "end": "06:30", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin. L-carnitine + black coffee."}},
    {"day": 3, "start": "06:30", "end": "07:15", "title": "RUNNING (Hilly Route)", "type": "exercise",
     "meta": {"detail": "30 min moderate run. Second run of the week."}},
    {"day": 3, "start": "07:15", "end": "08:00", "title": "Shower + Get Ready", "type": "routine",
     "meta": {"detail": "45 min buffer. Shower, eat, commute to German."}},
    {"day": 3, "start": "08:00", "end": "08:15", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "Quick eat before class. ~400 kcal, 25g protein."}},
    {"day": 3, "start": "08:15", "end": "12:00", "title": "German Class", "type": "class",
     "meta": {"detail": "Room 09-012", "location": "09-012"}},
    {"day": 3, "start": "12:00", "end": "12:30", "title": "Lunch: Chicken + Rice", "type": "meal",
     "meta": {"detail": "150g chicken, 100g rice, cucumber. ~350 kcal. Eat before cycling."}},
    {"day": 3, "start": "12:30", "end": "13:30", "title": "Indoor Cycling", "type": "exercise",
     "meta": {"detail": "Good calorie burn session."}},
    {"day": 3, "start": "13:30", "end": "14:15", "title": "Shower + Snack", "type": "routine",
     "meta": {"detail": "45 min buffer. Protein shake or rice cake + Quark. ~160 kcal."}},
    {"day": 3, "start": "14:15", "end": "18:00", "title": "Simulation of Complex Systems", "type": "class",
     "meta": {"detail": "Room 01-106. Technologies/Using Computer Simulation for Understanding Organizations.", "location": "01-106"}},
    {"day": 3, "start": "18:00", "end": "18:30", "title": "Dinner: Egg + Salad", "type": "meal",
     "meta": {"detail": "3 boiled eggs, big salad with feta, lemon. ~310 kcal, 24g protein."}},
    {"day": 3, "start": "18:30", "end": "22:00", "title": "FCS Prep and Work", "type": "focus",
     "meta": {"detail": "FCS prep, thesis, or job hunt. Flex block."}},
    {"day": 3, "start": "22:00", "end": "22:30", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "Prep overnight oats. Magnesium."}},

    # ===== FRIDAY (day_of_week=4) =====
    # CrossFit morning, breakfast after + shower
    {"day": 4, "start": "06:15", "end": "06:30", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin. L-carnitine + black coffee."}},
    {"day": 4, "start": "06:30", "end": "07:15", "title": "Travel to CrossFit", "type": "routine",
     "meta": {"detail": "Get ready, commute."}},
    {"day": 4, "start": "08:00", "end": "09:00", "title": "CrossFit", "type": "exercise",
     "meta": {"detail": "Morning session."}},
    {"day": 4, "start": "09:00", "end": "09:45", "title": "Shower + Get Ready", "type": "routine",
     "meta": {"detail": "45 min buffer. Post workout protein shake."}},
    {"day": 4, "start": "09:45", "end": "10:15", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "After shower. ~400 kcal, 25g protein."}},
    {"day": 4, "start": "10:15", "end": "12:00", "title": "THESIS DEEP WORK", "type": "focus",
     "meta": {"detail": "Friday morning focus block."}},
    {"day": 4, "start": "12:15", "end": "14:00", "title": "FCS + Grundlagen Lectures", "type": "class",
     "meta": {"detail": "Room 52-5120. FCS 12:15 to 2pm, Grundlagen 12:15 to 2pm.", "location": "52-5120"}},
    {"day": 4, "start": "14:00", "end": "14:30", "title": "Lunch: Daal Chawal", "type": "meal",
     "meta": {"detail": "150g rice, 200g daal, cucumber. ~380 kcal."}},
    {"day": 4, "start": "14:30", "end": "16:30", "title": "FCS Prep / Assignments", "type": "focus",
     "meta": {"detail": "FCS presentation prep, assignments."}},
    {"day": 4, "start": "16:30", "end": "17:00", "title": "Snack", "type": "meal",
     "meta": {"detail": "Apple + a few almonds. ~200 kcal."}},
    {"day": 4, "start": "17:00", "end": "18:30", "title": "JOB HUNT / Thesis", "type": "focus",
     "meta": {"detail": "End of week push. Applications or thesis."}},
    {"day": 4, "start": "19:00", "end": "19:30", "title": "Dinner: Chicken Salad", "type": "meal",
     "meta": {"detail": "150g chicken, salad, feta. ~350 kcal, 42g protein."}},
    {"day": 4, "start": "21:30", "end": "22:00", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "Prep overnight oats. Magnesium."}},

    # ===== SATURDAY (day_of_week=5) =====
    # Long run, breakfast after + shower
    {"day": 5, "start": "07:30", "end": "07:45", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin. L-carnitine + black coffee."}},
    {"day": 5, "start": "08:00", "end": "09:00", "title": "RUNNING (Long Run)", "type": "exercise",
     "meta": {"detail": "45-60 min. Third run of the week. Longer, steadier pace."}},
    {"day": 5, "start": "09:00", "end": "09:45", "title": "Shower + Get Ready", "type": "routine",
     "meta": {"detail": "45 min buffer. Post run protein shake."}},
    {"day": 5, "start": "09:45", "end": "10:15", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "After shower. Plus protein shake already had. ~530 kcal, 55g protein total."}},
    {"day": 5, "start": "10:30", "end": "12:30", "title": "MEAL PREP", "type": "routine",
     "meta": {"detail": "Batch cook: grill chicken (500g+), boil daal, cook rice, chop salad veggies."}},
    {"day": 5, "start": "12:30", "end": "13:00", "title": "Lunch: Chicken + Rice", "type": "meal",
     "meta": {"detail": "From meal prep. 150g chicken, 150g rice, salad. ~400 kcal."}},
    {"day": 5, "start": "13:00", "end": "14:00", "title": "GROCERY SHOPPING", "type": "routine",
     "meta": {"detail": "Halal store + Lidl/Aldi. See grocery list."}},
    {"day": 5, "start": "14:15", "end": "15:45", "title": "Football", "type": "exercise",
     "meta": {"detail": "Afternoon match."}},
    {"day": 5, "start": "16:00", "end": "18:00", "title": "Thesis / Catch Up", "type": "focus",
     "meta": {"detail": "Flexible: thesis, assignments, or course catch up."}},
    {"day": 5, "start": "18:30", "end": "19:00", "title": "Dinner: Daal Chawal", "type": "meal",
     "meta": {"detail": "150g rice, 200g daal, cucumber. ~380 kcal."}},
    {"day": 5, "start": "19:00", "end": "21:00", "title": "Free Time / Social", "type": "social",
     "meta": {"detail": "Relax, friends, F1 if on, movie."}},
    {"day": 5, "start": "22:00", "end": "22:30", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "Prep overnight oats for Sunday. Magnesium."}},

    # ===== SUNDAY (day_of_week=6) =====
    # Rest day, normal breakfast timing
    {"day": 6, "start": "08:30", "end": "08:45", "title": "Wake Up + Supplements", "type": "routine",
     "meta": {"detail": "ACV shot, magnesium, multivitamin. Sleep in."}},
    {"day": 6, "start": "08:45", "end": "09:15", "title": "Breakfast: Overnight Oats", "type": "meal",
     "meta": {"detail": "Prepped last night. No workout so eat first."}},
    {"day": 6, "start": "09:30", "end": "10:00", "title": "Stretch + Mobility (30 min)", "type": "exercise",
     "meta": {"detail": "Full body stretch. Foam roll. Recovery day focus."}},
    {"day": 6, "start": "10:00", "end": "10:30", "title": "WEEKLY PLANNING", "type": "routine",
     "meta": {"detail": "Review week ahead. Set thesis goals. Check job hunt pipeline."}},
    {"day": 6, "start": "10:30", "end": "12:30", "title": "THESIS DEEP WORK", "type": "focus",
     "meta": {"detail": "Sunday calm = great focus."}},
    {"day": 6, "start": "12:30", "end": "13:00", "title": "Lunch: Daal Chawal", "type": "meal",
     "meta": {"detail": "From batch cook. 150g rice, 200g daal, cucumber."}},
    {"day": 6, "start": "13:00", "end": "14:30", "title": "MEAL PREP (Round 2)", "type": "routine",
     "meta": {"detail": "Prep daal for Mon-Wed. Boil eggs (6). Chop veggies. Cook rice."}},
    {"day": 6, "start": "14:30", "end": "16:30", "title": "Course Work / German", "type": "focus",
     "meta": {"detail": "Catch up. German vocab review."}},
    {"day": 6, "start": "16:30", "end": "17:00", "title": "Snack", "type": "meal",
     "meta": {"detail": "Rice cakes + Quark, or fruit. ~160 kcal."}},
    {"day": 6, "start": "17:00", "end": "18:30", "title": "JOB HUNT", "type": "focus",
     "meta": {"detail": "Sunday evening batch. Prep for the week."}},
    {"day": 6, "start": "19:00", "end": "19:30", "title": "Dinner: Egg Scramble", "type": "meal",
     "meta": {"detail": "3 eggs, tomato, spinach, side salad. ~280 kcal, 22g protein."}},
    {"day": 6, "start": "20:00", "end": "21:30", "title": "Free Time", "type": "social",
     "meta": {"detail": "Relax. Watch something. Call family."}},
    {"day": 6, "start": "21:30", "end": "22:00", "title": "Wind Down", "type": "routine",
     "meta": {"detail": "Prep overnight oats for Monday. Magnesium. Set alarm."}},
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    
    # I create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # I check if user already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.username == "sal"))
        if result.scalar_one_or_none():
            print("User already exists. Skipping seed.")
            return
        
        # I create the default user
        user = User(
            username="sal",
            email="sal@lifeplan.app",
            hashed_password=hash_password("changeme123"),
            role="admin",
            current_weight_kg=98.6,
            target_weight_kg=81.0,
            height_cm=175.0,
            age=28,
            daily_calorie_target=2100,
            daily_protein_target=190,
        )
        db.add(user)
        await db.flush()
        
        # I seed the schedule
        for event_data in SCHEDULE_SEED:
            event = ScheduleEvent(
                user_id=user.id,
                title=event_data["title"],
                event_type=EventType(event_data["type"]),
                day_of_week=event_data["day"],
                start_time=time.fromisoformat(event_data["start"]),
                end_time=time.fromisoformat(event_data["end"]),
                location=event_data.get("meta", {}).get("location"),
                event_data=event_data.get("meta", {}),
                recurrence=RecurrenceType.WEEKLY,
            )
            db.add(event)
        
        # I seed meal templates
        for meal_data in DEFAULT_MEALS:
            template = MealTemplate(
                user_id=user.id,
                name=meal_data["name"],
                meal_type=meal_data["meal_type"],
                calories=meal_data["calories"],
                protein_g=meal_data["protein_g"],
                carbs_g=meal_data.get("carbs_g"),
                fat_g=meal_data.get("fat_g"),
                fiber_g=meal_data.get("fiber_g"),
                ingredients=meal_data["ingredients"],
                prep_instructions=meal_data.get("prep_instructions"),
                prep_time_minutes=meal_data.get("prep_time_minutes"),
                source="default",
            )
            db.add(template)
        
        await db.commit()
        print(f"Seeded user (id={user.id}), {len(SCHEDULE_SEED)} events, {len(DEFAULT_MEALS)} meal templates.")


if __name__ == "__main__":
    asyncio.run(seed())
