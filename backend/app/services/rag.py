import json
import logging
import numpy as np
from typing import Optional
from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import get_settings
from app.models.meal import MealLog
from app.models.analytics import WorkoutLog
from app.models.schedule import ScheduleModification

logger = logging.getLogger(__name__)
settings = get_settings()

# I load the embedding model once at module level — it stays in memory
_embedding_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """I lazy-load the sentence-transformers model on first use."""
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded.")
    return _embedding_model


def get_embedding(content: str) -> list[float]:
    """I generate a local embedding using sentence-transformers."""
    model = get_embedding_model()
    embedding = model.encode(content, normalize_embeddings=True)
    return embedding.tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """I compute cosine similarity between two embedding vectors."""
    a_arr = np.array(a)
    b_arr = np.array(b)
    norm = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    if norm == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / norm)


async def retrieve_relevant_context(
    query: str,
    user_id: int,
    db: AsyncSession,
    top_k: int = 5,
) -> str:
    """
    I retrieve the most relevant context from the user's history for RAG.
    I search across meal logs, workout logs, and schedule modifications
    using local sentence-transformer embeddings and cosine similarity.
    """
    try:
        query_embedding = get_embedding(query)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        return ""

    documents = []

    try:
        meal_result = await db.execute(
            select(MealLog)
            .where(MealLog.user_id == user_id)
            .where(MealLog.embedding.isnot(None))
            .order_by(MealLog.created_at.desc())
            .limit(50)
        )
        for meal in meal_result.scalars():
            documents.append({
                "type": "meal",
                "content": (
                    f"Meal: {meal.name} ({meal.meal_type}) on {meal.date}. "
                    f"Calories: {meal.calories}, Protein: {meal.protein_g}g. "
                    f"Notes: {meal.notes or 'none'}"
                ),
                "embedding": meal.embedding,
            })
    except Exception as e:
        logger.error(f"Failed to fetch meal logs for RAG: {e}")

    try:
        workout_result = await db.execute(
            select(WorkoutLog)
            .where(WorkoutLog.user_id == user_id)
            .where(WorkoutLog.embedding.isnot(None))
            .order_by(WorkoutLog.created_at.desc())
            .limit(50)
        )
        for workout in workout_result.scalars():
            documents.append({
                "type": "workout",
                "content": (
                    f"Workout: {workout.workout_type} on {workout.date}. "
                    f"Duration: {workout.duration_minutes}min, Intensity: {workout.intensity}. "
                    f"Energy level: {workout.energy_level}/5. Notes: {workout.notes or 'none'}"
                ),
                "embedding": workout.embedding,
            })
    except Exception as e:
        logger.error(f"Failed to fetch workout logs for RAG: {e}")

    try:
        mod_result = await db.execute(
            select(ScheduleModification)
            .where(ScheduleModification.user_id == user_id)
            .where(ScheduleModification.embedding.isnot(None))
            .order_by(ScheduleModification.created_at.desc())
            .limit(30)
        )
        for mod in mod_result.scalars():
            documents.append({
                "type": "modification",
                "content": (
                    f"Schedule change ({mod.modification_type}): {mod.reason or 'no reason given'}. "
                    f"Changed: {json.dumps(mod.old_value)} -> {json.dumps(mod.new_value)}"
                ),
                "embedding": mod.embedding,
            })
    except Exception as e:
        logger.error(f"Failed to fetch schedule modifications for RAG: {e}")

    if not documents:
        return ""

    for doc in documents:
        if doc["embedding"]:
            doc["score"] = cosine_similarity(query_embedding, doc["embedding"])
        else:
            doc["score"] = 0.0

    documents.sort(key=lambda x: x["score"], reverse=True)
    top_docs = documents[:top_k]

    context_parts = [
        f"[{doc['type'].upper()}] {doc['content']}"
        for doc in top_docs
        if doc["score"] > 0.3
    ]

    return "\n\n".join(context_parts) if context_parts else ""


async def embed_and_store_meal(meal: MealLog, db: AsyncSession) -> None:
    """I generate and store a local embedding for a new meal log entry."""
    try:
        content = (
            f"Ate {meal.name} for {meal.meal_type}. "
            f"Calories: {meal.calories}, Protein: {meal.protein_g}g. "
            f"{meal.notes or ''}"
        )
        meal.embedding = get_embedding(content)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to embed meal log {meal.id}: {e}")


async def embed_and_store_workout(workout: WorkoutLog, db: AsyncSession) -> None:
    """I generate and store a local embedding for a new workout log entry."""
    try:
        content = (
            f"{workout.workout_type} workout, {workout.duration_minutes} minutes, "
            f"intensity: {workout.intensity}. Energy: {workout.energy_level}/5. "
            f"{workout.notes or ''}"
        )
        workout.embedding = get_embedding(content)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to embed workout log {workout.id}: {e}")


async def embed_and_store_modification(mod: ScheduleModification, db: AsyncSession) -> None:
    """I generate and store a local embedding for a schedule modification."""
    try:
        content = (
            f"User modified schedule: {mod.modification_type}. "
            f"Reason: {mod.reason or 'not specified'}. "
            f"Old: {json.dumps(mod.old_value)}, New: {json.dumps(mod.new_value)}"
        )
        mod.embedding = get_embedding(content)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to embed schedule modification {mod.id}: {e}")
