from datetime import date
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.meal import MealTemplate, GroceryList


# I define the default meal templates based on Sal's preferences
DEFAULT_MEALS = [
    {
        "name": "Overnight Oats",
        "meal_type": "breakfast",
        "calories": 400,
        "protein_g": 25,
        "carbs_g": 55,
        "fat_g": 10,
        "fiber_g": 8,
        "ingredients": [
            {"name": "rolled oats", "amount_g": 50, "calories": 190, "protein": 6},
            {"name": "Greek yogurt (low fat)", "amount_g": 150, "calories": 90, "protein": 15},
            {"name": "semi skimmed milk", "amount_ml": 150, "calories": 68, "protein": 5},
            {"name": "chia seeds", "amount_g": 10, "calories": 49, "protein": 2},
            {"name": "banana", "amount": "1 medium", "calories": 105, "protein": 1},
            {"name": "frozen mixed berries", "amount_g": 50, "calories": 25, "protein": 0.5},
        ],
        "prep_instructions": "Combine oats, yogurt, milk, and chia seeds in a jar the night before. Top with banana and berries in the morning.",
        "prep_time_minutes": 5,
    },
    {
        "name": "Grilled Chicken Salad",
        "meal_type": "lunch",
        "calories": 350,
        "protein_g": 42,
        "carbs_g": 12,
        "fat_g": 14,
        "fiber_g": 4,
        "ingredients": [
            {"name": "chicken breast (grilled)", "amount_g": 150, "calories": 165, "protein": 31},
            {"name": "iceberg/romaine lettuce", "amount_g": 100, "calories": 14, "protein": 1},
            {"name": "cucumber", "amount_g": 80, "calories": 12, "protein": 0.5},
            {"name": "tomato", "amount_g": 80, "calories": 14, "protein": 0.7},
            {"name": "feta cheese", "amount_g": 30, "calories": 80, "protein": 4},
            {"name": "lemon juice + salt dressing", "amount": "1 tbsp", "calories": 5, "protein": 0},
        ],
        "prep_instructions": "Slice chicken from batch cook. Chop veggies. Crumble feta. Dress with lemon and salt.",
        "prep_time_minutes": 10,
    },
    {
        "name": "Daal Chawal (Red Lentil)",
        "meal_type": "lunch",
        "calories": 380,
        "protein_g": 18,
        "carbs_g": 65,
        "fat_g": 3,
        "fiber_g": 10,
        "ingredients": [
            {"name": "cooked basmati rice", "amount_g": 150, "calories": 195, "protein": 4},
            {"name": "red split lentil daal (boiled, no oil)", "amount_g": 200, "calories": 160, "protein": 12},
            {"name": "spices (cumin, turmeric, chili, salt)", "amount": "to taste", "calories": 5, "protein": 0},
            {"name": "cucumber (side)", "amount_g": 80, "calories": 12, "protein": 0.5},
        ],
        "prep_instructions": "Boil lentils with spices until soft. Serve over rice with salt. Cucumber on the side.",
        "prep_time_minutes": 5,
    },
    {
        "name": "Daal Chawal (Channa)",
        "meal_type": "dinner",
        "calories": 400,
        "protein_g": 22,
        "carbs_g": 62,
        "fat_g": 4,
        "fiber_g": 12,
        "ingredients": [
            {"name": "cooked basmati rice", "amount_g": 150, "calories": 195, "protein": 4},
            {"name": "channa daal (boiled, no oil)", "amount_g": 200, "calories": 180, "protein": 16},
            {"name": "spices (cumin, turmeric, chili, salt)", "amount": "to taste", "calories": 5, "protein": 0},
            {"name": "cucumber (side)", "amount_g": 80, "calories": 12, "protein": 0.5},
        ],
        "prep_instructions": "Boil channa daal with spices. Serve over rice. Cucumber on the side.",
        "prep_time_minutes": 5,
    },
    {
        "name": "Egg Scramble with Veggies",
        "meal_type": "dinner",
        "calories": 280,
        "protein_g": 22,
        "carbs_g": 6,
        "fat_g": 18,
        "fiber_g": 3,
        "ingredients": [
            {"name": "eggs", "amount": "3 large", "calories": 210, "protein": 18},
            {"name": "tomato (diced)", "amount_g": 50, "calories": 9, "protein": 0.4},
            {"name": "frozen spinach", "amount_g": 50, "calories": 12, "protein": 1.5},
            {"name": "lettuce + cucumber side", "amount_g": 80, "calories": 12, "protein": 0.5},
        ],
        "prep_instructions": "Scramble eggs in non stick pan (no oil). Add tomato and spinach. Serve with side salad.",
        "prep_time_minutes": 8,
    },
    {
        "name": "Boiled Eggs + Salad",
        "meal_type": "dinner",
        "calories": 310,
        "protein_g": 24,
        "carbs_g": 8,
        "fat_g": 18,
        "fiber_g": 3,
        "ingredients": [
            {"name": "eggs (boiled)", "amount": "3 large", "calories": 210, "protein": 18},
            {"name": "lettuce", "amount_g": 80, "calories": 11, "protein": 0.7},
            {"name": "cucumber", "amount_g": 80, "calories": 12, "protein": 0.5},
            {"name": "tomato", "amount_g": 60, "calories": 11, "protein": 0.5},
            {"name": "feta cheese", "amount_g": 30, "calories": 80, "protein": 4},
        ],
        "prep_instructions": "Boil eggs (from batch). Assemble salad. Crumble feta.",
        "prep_time_minutes": 3,
    },
    {
        "name": "Protein Shake (Post Workout)",
        "meal_type": "snack",
        "calories": 130,
        "protein_g": 30,
        "carbs_g": 3,
        "fat_g": 1,
        "fiber_g": 0,
        "ingredients": [
            {"name": "whey protein powder", "amount_g": 30, "calories": 120, "protein": 25},
            {"name": "water", "amount_ml": 300, "calories": 0, "protein": 0},
        ],
        "prep_instructions": "Mix whey with cold water. Shake well.",
        "prep_time_minutes": 1,
    },
    {
        "name": "Apple + Almonds",
        "meal_type": "snack",
        "calories": 200,
        "protein_g": 5,
        "carbs_g": 28,
        "fat_g": 9,
        "fiber_g": 5,
        "ingredients": [
            {"name": "apple", "amount": "1 medium", "calories": 95, "protein": 0.5},
            {"name": "almonds", "amount_g": 15, "calories": 87, "protein": 3},
        ],
        "prep_instructions": "Grab and go.",
        "prep_time_minutes": 0,
    },
    {
        "name": "Rice Cakes + Quark",
        "meal_type": "snack",
        "calories": 160,
        "protein_g": 15,
        "carbs_g": 20,
        "fat_g": 2,
        "fiber_g": 1,
        "ingredients": [
            {"name": "rice cakes", "amount": "2 pieces", "calories": 70, "protein": 1.5},
            {"name": "Quark (low fat)", "amount_g": 100, "calories": 65, "protein": 12},
        ],
        "prep_instructions": "Spread Quark on rice cakes.",
        "prep_time_minutes": 1,
    },
    {
        "name": "Banana + Protein Shake",
        "meal_type": "snack",
        "calories": 235,
        "protein_g": 31,
        "carbs_g": 30,
        "fat_g": 1.5,
        "fiber_g": 3,
        "ingredients": [
            {"name": "banana", "amount": "1 medium", "calories": 105, "protein": 1},
            {"name": "whey protein", "amount_g": 30, "calories": 120, "protein": 25},
            {"name": "water", "amount_ml": 300, "calories": 0, "protein": 0},
        ],
        "prep_instructions": "Shake protein. Eat banana.",
        "prep_time_minutes": 1,
    },
]


async def seed_meal_templates(user_id: int, db: AsyncSession):
    """I seed the default meal templates for a new user."""
    for meal_data in DEFAULT_MEALS:
        template = MealTemplate(
            user_id=user_id,
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


def generate_weekly_grocery(meal_plan: list[dict]) -> dict:
    """I generate a grocery list from the week's meal plan, grouped by store."""
    # I aggregate all ingredients across the week
    ingredient_totals = {}
    for day_meals in meal_plan:
        for meal in day_meals.get("meals", []):
            for ing in meal.get("ingredients", []):
                name = ing["name"].lower()
                if name not in ingredient_totals:
                    ingredient_totals[name] = {"count": 0, "unit": ing.get("amount", "")}
                ingredient_totals[name]["count"] += 1
    
    # I map ingredients to stores
    HALAL_ITEMS = {"chicken breast"}
    MIGROS_ITEMS = {"whey protein powder", "l-carnitine", "magnesium supplement", "multivitamin", "apple cider vinegar"}
    
    grocery = {
        "Halal Store": [],
        "Lidl / Aldi / Denner": [],
        "Migros (monthly)": [],
    }
    
    for name, data in ingredient_totals.items():
        if any(h in name for h in HALAL_ITEMS):
            grocery["Halal Store"].append({"item": name, "frequency": data["count"]})
        elif any(m in name for m in MIGROS_ITEMS):
            grocery["Migros (monthly)"].append({"item": name, "frequency": data["count"]})
        else:
            grocery["Lidl / Aldi / Denner"].append({"item": name, "frequency": data["count"]})
    
    return grocery
