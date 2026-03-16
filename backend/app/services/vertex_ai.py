import json
import re
import logging
from google import genai
from google.genai import types
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: genai.Client | None = None


def get_client() -> genai.Client:
    """I lazily create the Vertex AI client using Application Default Credentials."""
    global _client
    if _client is None:
        _client = genai.Client(
            vertexai=True,
            project=settings.GCP_PROJECT_ID,
            location=settings.GCP_REGION,
        )
    return _client


SYSTEM_PROMPT = """You are a nutrition and routine assistant for Sal, a 28-year-old male in St. Gallen, Switzerland.

PROFILE:
- Current weight: {weight}kg, Target: {target}kg, Height: {height}cm, Age: {age}
- Daily targets: {calories} kcal, {protein}g protein
- Diet: Halal, no alcohol. Prefers simple cooking.
- Likes: chicken breast, eggs, Greek yogurt, feta, lettuce, cucumber, tomato, lentils (red split, channa), basmati rice, oats, bananas, berries, apples
- Dislikes: rucola/arugula
- Grocery stores: Lidl, Aldi, Denner. Halal chicken from local halal store (2kg boneless breast for 16 CHF). Supplements from Migros.
- Training: CrossFit 3x/week, running 2-3x/week, football, yoga, cycling
- Goal: Weight loss while maintaining muscle

CONVERSATIONAL RULES:
1. Always respond in friendly, conversational text. Include macros inline when suggesting meals (e.g. "~350 kcal, 40g protein, 25g carbs, 10g fat").
2. Keep meals simple, affordable, and halal — Swiss market prices. If CURRENT PANTRY/INVENTORY is provided in context, prioritize ingredients already available at home.
3. When asked for a grocery list, cross-reference the inventory and only list items that are missing or low.
4. ALWAYS complete your full response. Never cut off mid-sentence or mid-list. If giving a recipe, include all steps and ingredients before stopping.
5. Do NOT output JSON unless the user explicitly confirms they want to save something (e.g. "save this", "add it", "yes", "save that meal", "add to my meals", "finalise", "keep it").
5. ONLY when the user explicitly confirms saving a meal, respond with ONLY this JSON (no text before or after):
{{
  "action_type": "save_meal_template",
  "name": "Meal Name",
  "meal_type": "breakfast|lunch|dinner|snack",
  "calories": 350,
  "protein_g": 40,
  "carbs_g": 25,
  "fat_g": 10,
  "ingredients": [{{"name": "item", "amount": "150g", "calories": 165, "protein": 31}}],
  "prep_instructions": "brief instructions"
}}

6. ONLY when the user explicitly confirms adding a schedule event, respond with ONLY this JSON:
{{
  "action_type": "add_schedule_event",
  "title": "Event Title",
  "event_type": "routine|meal|exercise|focus|class|social|work",
  "day_of_week": 0,
  "start_time": "07:00",
  "end_time": "08:00",
  "reasoning": "why this fits the routine"
}}

7. ONLY when the user explicitly confirms saving a workout template (e.g. "save this workout", "save it", "add to my workouts"), respond with ONLY this JSON:
{{
  "action_type": "save_workout_template",
  "name": "Workout Name",
  "workout_type": "strength|crossfit|running|hiit|yoga|cycling|football|boxing|swimming",
  "exercises": [
    {{"name": "Exercise Name", "sets": 4, "reps": "8-10", "weight_suggestion_kg": 60, "notes": "optional tip"}}
  ],
  "description": "Brief overall description of the workout",
  "estimated_duration": 60,
  "tags": ["chest", "strength", "hypertrophy"]
}}
For CrossFit/cardio templates where sets don't apply, use null for sets and describe reps as rounds/time. Always include exercises even for cardio (e.g. WOD movements).
"""

def _repair_json(text: str) -> str:
    """I fix common AI JSON output issues like thousands separators and trailing commas."""
    # Fix thousands separators: 1,234 → 1234 (matches digit,3digits at word boundary)
    text = re.sub(r'(\d{1,3}),(\d{3})\b', r'\1\2', text)
    # Remove trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', text)
    return text.strip()


def _strip_code_fences(text: str) -> str:
    """I remove markdown code fences (```json ... ```) robustly."""
    if "```" not in text:
        return text
    # Split on ``` and find the part that looks like JSON
    parts = text.split("```")
    for part in parts:
        cleaned = part.lstrip("json").lstrip("JSON").strip()
        if cleaned.startswith("{") or cleaned.startswith("["):
            return cleaned
    # Fallback: try to find { ... } directly
    if "{" in text:
        start = text.index("{")
        end = text.rindex("}") + 1
        return text[start:end]
    return text


_WORKOUT_METS = {
    "crossfit": 8.0, "running": 8.3, "football": 7.0,
    "yoga": 3.0, "cycling": 7.5, "stretch": 2.5,
    "swimming": 7.0, "hiit": 8.5, "walking": 3.5,
}


def _estimate_calories_fallback(workout_type: str, duration_minutes: int, weight_kg: float) -> int:
    met = _WORKOUT_METS.get(workout_type.lower(), 6.0)
    return round(met * weight_kg * (duration_minutes / 60))


async def chat_with_ai(
    message: str,
    user_profile: dict,
    conversation_history: list[dict] = None,
    rag_context: str = "",
) -> dict:
    """I send a message to Gemini via the new google-genai SDK and return the response."""
    client = get_client()

    system_instruction = SYSTEM_PROMPT.format(
        weight=user_profile.get("current_weight_kg", 98.6),
        target=user_profile.get("target_weight_kg", 81.0),
        height=user_profile.get("height_cm", 175),
        age=user_profile.get("age", 28),
        calories=user_profile.get("daily_calorie_target", 2100),
        protein=user_profile.get("daily_protein_target", 190),
    )

    # I build the conversation contents list
    contents = []

    if conversation_history:
        for msg in conversation_history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

    # I append RAG context to the final user message if available
    user_text = message
    if rag_context:
        user_text = f"CONTEXT FROM USER HISTORY:\n{rag_context}\n\nUSER MESSAGE:\n{message}"

    contents.append(types.Content(role="user", parts=[types.Part(text=user_text)]))

    response = await client.aio.models.generate_content(
        model=settings.VERTEX_AI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=4096,
        ),
    )

    response_text = response.text
    result = {"text": response_text, "structured_data": None}

    try:
        if "{" in response_text and "}" in response_text:
            json_start = response_text.index("{")
            json_end = response_text.rindex("}") + 1
            parsed = json.loads(response_text[json_start:json_end])
            result["structured_data"] = parsed
            # I strip the raw JSON block from the display text so it doesn't show in chat
            before_json = response_text[:json_start].strip()
            # Remove any trailing markdown code fence (```json or ```)
            before_json = before_json.rstrip("`").rstrip("json").rstrip("`").strip()
            result["text"] = before_json if before_json else ""
    except (json.JSONDecodeError, ValueError):
        pass

    return result


async def analyze_workout(
    workout_type: str,
    duration_minutes: int,
    intensity: str,
    description: str,
    user_profile: dict,
) -> dict:
    """I use Gemini to analyze a workout and return calories, impact, recovery recommendations."""
    weight = user_profile.get("current_weight_kg", 98.6)

    if not settings.GCP_PROJECT_ID:
        return {
            "calories_burned": _estimate_calories_fallback(workout_type, duration_minutes, weight),
            "intensity_score": {"low": 4, "moderate": 6, "high": 8}.get(intensity.lower(), 6),
            "muscle_groups": [],
            "cardio_impact": intensity,
            "recovery_hours": {"low": 12, "moderate": 24, "high": 36}.get(intensity.lower(), 24),
            "notes": "GCP not configured — used estimated values.",
            "weekly_impact": "Log GCP credentials to get AI analysis.",
        }

    client = get_client()

    prompt = f"""Analyze this workout. Respond ONLY with valid JSON, no other text.

ATHLETE: weight {weight}kg, goal: weight loss while maintaining muscle
WORKOUT: {workout_type} | {duration_minutes} min | {intensity} intensity
DESCRIPTION: {description or "No description provided"}

Respond with exactly this JSON structure:
{{
  "calories_burned": 450,
  "intensity_score": 7,
  "muscle_groups": ["quads", "glutes", "core"],
  "cardio_impact": "high",
  "recovery_hours": 24,
  "notes": "One brief coaching insight sentence.",
  "weekly_impact": "How this fits the weight loss goal."
}}"""

    try:
        response = await client.aio.models.generate_content(
            model=settings.VERTEX_AI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=512),
        )
        text = response.text.strip()
        text = _strip_code_fences(text)
        return json.loads(text)
    except Exception as e:
        logger.error(f"Workout analysis failed: {e}")
        return {
            "calories_burned": _estimate_calories_fallback(workout_type, duration_minutes, weight),
            "notes": "AI analysis unavailable — used estimated calories.",
        }


async def calculate_macros_from_description(food_description: str) -> dict:
    """I use Gemini to estimate macros from a free text food description."""
    client = get_client()

    # I deliberately ask for compact single-line JSON to avoid mid-generation truncation
    # that occurs when Gemini formats multi-line output and hits a safety/recitation stop.
    prompt = (
        f"You are a nutrition calculator. Output ONLY a single compact JSON object on ONE LINE "
        f"with NO newlines, NO indentation, NO markdown, NO extra text.\n"
        f"Use plain integers for all numbers. Never use commas in numbers (1500 not 1,500).\n"
        f"Food: {food_description}\n"
        f'Format: {{"name":"string","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,'
        f'"ingredients":[{{"name":"string","amount":"string"}}]}}'
    )

    text = ""
    try:
        response = await client.aio.models.generate_content(
            model=settings.VERTEX_AI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.0, max_output_tokens=2048),
        )
        # I guard against None/empty response (safety filter, quota, or empty candidates)
        if not response.text:
            logger.error("Gemini returned empty/None text for macro estimation")
            return {"error": "Could not parse nutritional data"}
        # I also log finish_reason when available to diagnose truncations
        try:
            finish = response.candidates[0].finish_reason if response.candidates else "unknown"
            if str(finish) not in ("FinishReason.STOP", "STOP", "1"):
                logger.warning(f"Macro estimation finish_reason={finish}")
        except Exception:
            pass
        text = response.text.strip()
        text = _strip_code_fences(text)
        text = _repair_json(text)
        return json.loads(text)
    except Exception as e:
        logger.error(f"Failed to parse macro estimation response: {e} | raw: {text[:300]}")
        return {"error": "Could not parse nutritional data"}
