import json
import re
import logging
from google import genai
from google.genai import types
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_clients: dict[str, genai.Client] = {}


def _csv_values(raw: str) -> list[str]:
    return [v.strip() for v in (raw or "").split(",") if v.strip()]


def _unique(values: list[str]) -> list[str]:
    seen = set()
    ordered = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def _candidate_regions() -> list[str]:
    return _unique([settings.GCP_REGION, *_csv_values(settings.VERTEX_AI_FALLBACK_REGIONS)])


def _candidate_models(preferred_model: str | None = None) -> list[str]:
    base = preferred_model or settings.VERTEX_AI_MODEL
    return _unique([base, *_csv_values(settings.VERTEX_AI_MODEL_FALLBACKS)])


def get_client(location: str | None = None) -> genai.Client:
    """I lazily create a Vertex AI client per region using ADC."""
    region = location or settings.GCP_REGION
    if region not in _clients:
        _clients[region] = genai.Client(
            vertexai=True,
            project=settings.GCP_PROJECT_ID,
            location=region,
        )
    return _clients[region]


async def generate_content_with_fallback(
    contents,
    config: types.GenerateContentConfig,
    preferred_model: str | None = None,
):
    """I try model/region fallbacks so transient model availability issues do not hard-fail."""
    errors = []
    models = _candidate_models(preferred_model)
    regions = _candidate_regions()

    for region in regions:
        client = get_client(region)
        for model_name in models:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                if region != settings.GCP_REGION or model_name != (preferred_model or settings.VERTEX_AI_MODEL):
                    logger.warning(
                        "Vertex AI fallback succeeded with model=%s region=%s",
                        model_name,
                        region,
                    )
                return response
            except Exception as e:
                logger.warning(
                    "Vertex AI generate failed model=%s region=%s error=%s",
                    model_name,
                    region,
                    e,
                )
                errors.append(f"{region}/{model_name}: {type(e).__name__}")

    attempts = ", ".join(errors[:6])
    raise RuntimeError(
        "Vertex AI failed for all configured model/region candidates"
        + (f" ({attempts})" if attempts else "")
    )


SYSTEM_PROMPT = """You are a nutrition and routine assistant for {username}, a 28-year-old male in St. Gallen, Switzerland.

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
2. Keep meals simple, affordable, and halal - Swiss market prices. If CURRENT PANTRY/INVENTORY is provided in context, prioritize ingredients already available at home.
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
    # Fix thousands separators: 1,234 -> 1234 (matches digit,3digits at word boundary)
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


def _fallback_workout_analysis(
    workout_type: str,
    duration_minutes: int,
    intensity: str,
    weight_kg: float,
    note: str,
) -> dict:
    intensity_norm = (intensity or "moderate").lower()
    intensity_score = {"low": 4, "moderate": 6, "high": 8}.get(intensity_norm, 6)
    recovery_hours = {"low": 12, "moderate": 24, "high": 36}.get(intensity_norm, 24)
    return {
        "calories_burned": _estimate_calories_fallback(workout_type, duration_minutes, weight_kg),
        "intensity_score": intensity_score,
        "muscle_groups": [],
        "cardio_impact": intensity_norm,
        "recovery_hours": recovery_hours,
        "notes": note,
        "weekly_impact": "Estimate only; AI analysis unavailable right now.",
    }


async def chat_with_ai(
    message: str,
    user_profile: dict,
    conversation_history: list[dict] = None,
    rag_context: str = "",
) -> dict:
    """I send a message to Gemini via the new google-genai SDK and return the response."""
    if not settings.GCP_PROJECT_ID:
        return {
            "text": "AI chat is unavailable because GCP is not configured on the backend.",
            "structured_data": None,
        }

    system_instruction = SYSTEM_PROMPT.format(
        username=user_profile.get("username", "there"),
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

    try:
        response = await generate_content_with_fallback(
            contents=contents,
            preferred_model=settings.VERTEX_AI_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=4096,
            ),
        )
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        return {
            "text": "AI is temporarily unavailable. Please try again in a minute.",
            "structured_data": None,
        }

    response_text = (response.text or "").strip()
    if not response_text:
        return {
            "text": "I couldn't generate a response right now. Please retry in a moment.",
            "structured_data": None,
        }
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
        return _fallback_workout_analysis(
            workout_type=workout_type,
            duration_minutes=duration_minutes,
            intensity=intensity,
            weight_kg=weight,
            note="GCP not configured; used estimated values.",
        )

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
        response = await generate_content_with_fallback(
            contents=prompt,
            preferred_model=settings.VERTEX_AI_MODEL,
            config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=512),
        )
        text = _repair_json(_strip_code_fences((response.text or "").strip()))
        parsed = json.loads(text)
        fallback = _fallback_workout_analysis(
            workout_type=workout_type,
            duration_minutes=duration_minutes,
            intensity=intensity,
            weight_kg=weight,
            note="Used estimated values.",
        )
        muscle_groups = parsed.get("muscle_groups") if isinstance(parsed.get("muscle_groups"), list) else []
        return {
            "calories_burned": parsed.get("calories_burned", fallback["calories_burned"]),
            "intensity_score": parsed.get("intensity_score", fallback["intensity_score"]),
            "muscle_groups": muscle_groups,
            "cardio_impact": parsed.get("cardio_impact", fallback["cardio_impact"]),
            "recovery_hours": parsed.get("recovery_hours", fallback["recovery_hours"]),
            "notes": parsed.get("notes", fallback["notes"]),
            "weekly_impact": parsed.get("weekly_impact", fallback["weekly_impact"]),
        }
    except Exception as e:
        logger.error(f"Workout analysis failed: {e}")
        return _fallback_workout_analysis(
            workout_type=workout_type,
            duration_minutes=duration_minutes,
            intensity=intensity,
            weight_kg=weight,
            note="AI analysis unavailable; used estimated calories.",
        )


async def calculate_macros_from_description(food_description: str) -> dict:
    """I use Gemini to estimate macros from a free text food description."""

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
        response = await generate_content_with_fallback(
            contents=prompt,
            preferred_model=settings.VERTEX_AI_MODEL,
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

