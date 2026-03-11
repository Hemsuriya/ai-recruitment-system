# main.py
import os
import io
import base64
import tempfile
import math
from datetime import timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# DeepFace
from deepface import DeepFace

# Redis
import redis
import json

load_dotenv()  # loads .env if present

# Configuration (use environment variables or defaults)
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_TTL_SECONDS = int(os.getenv("REDIS_TTL_SECONDS", 60 * 60))  # 1 hour by default
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "true").lower() in ("1", "true", "yes")

# Fallback directory for storing ID images if Redis not available
FALLBACK_DIR = Path(os.getenv("FALLBACK_DIR", "./id_cache"))
FALLBACK_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="ID Verification Service")

# Allow your frontend origin(s) here. For dev, allow all.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to specific origin in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis client if enabled
redis_client = None
if REDIS_ENABLED:
    try:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=False)
        # quick ping
        redis_client.ping()
        print("✅ Connected to Redis at", REDIS_HOST, REDIS_PORT)
    except Exception as e:
        print("⚠️ Redis connection failed:", e)
        print("⚠️ Falling back to filesystem cache.")
        redis_client = None
else:
    print("ℹ️ Redis disabled via REDIS_ENABLED=false — using filesystem fallback")
    redis_client = None


class UploadIDRequest(BaseModel):
    assessmentId: str
    imageBase64: str  # image as base64 (no data:image/... prefix required but supported)


class VerifySelfieRequest(BaseModel):
    assessmentId: str
    selfieBase64: str


def _strip_data_prefix(b64str: str) -> str:
    if b64str.startswith("data:"):
        # data:image/jpeg;base64,.... -> remove prefix
        return b64str.split(",", 1)[1]
    return b64str


def _save_bytes_to_temp_file(b: bytes, suffix: str = ".jpg") -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    with open(path, "wb") as f:
        f.write(b)
    return path


def _compute_confidence(distance: float, threshold: float) -> float:
    # same soft mapping as your original script
    try:
        confidence = 100.0 / (1.0 + math.exp(10.0 * (distance - threshold)))
        return round(confidence, 2)
    except Exception:
        return None


@app.post("/upload-id")
async def upload_id(payload: UploadIDRequest):
    """
    Stores the ID image in Redis (or filesystem) keyed by assessmentId.
    Accepts base64 image, returns success.
    """
    assessment_id = payload.assessmentId
    if not assessment_id:
        raise HTTPException(status_code=400, detail="assessmentId is required")

    b64 = _strip_data_prefix(payload.imageBase64)
    try:
        raw = base64.b64decode(b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")

    # store in Redis if available
    key = f"id_image:{assessment_id}"

    if redis_client:
        try:
            print("\n===== 📥 REDIS: Saving ID Image =====")
            print(f"Key: {key}")
            print(f"Assessment ID: {assessment_id}")
            print(f"Image byte length: {len(raw)}")
            print(f"TTL: {REDIS_TTL_SECONDS}")

            redis_client.setex(key, REDIS_TTL_SECONDS, raw)

            ttl_check = redis_client.ttl(key)
            print(f"✅ Successfully saved ID to Redis. TTL now = {ttl_check} seconds.")
            print("======================================\n")

            return {"success": True, "method": "redis", "ttl_seconds": REDIS_TTL_SECONDS}

        except Exception as e:
            print(f"❌ Redis SET failed: {e}")
            print("⚠️ Falling back to filesystem storage.")
    
    # Filesystem fallback
    try:
        p = FALLBACK_DIR / f"{assessment_id}.jpg"
        with open(p, "wb") as f:
            f.write(raw)
        return {"success": True, "method": "filesystem", "path": str(p)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store ID image: {e}")


@app.post("/verify-selfie")
async def verify_selfie(payload: VerifySelfieRequest):
    """
    Receives selfie base64 and assessmentId. Retrieves ID image from cache (redis or filesystem),
    runs DeepFace.verify and returns verification result.
    """
    assessment_id = payload.assessmentId
    if not assessment_id:
        raise HTTPException(status_code=400, detail="assessmentId is required")

    selfie_b64 = _strip_data_prefix(payload.selfieBase64)
    try:
        selfie_raw = base64.b64decode(selfie_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid selfie base64 image: {e}")

    # Retrieve ID image bytes
    key = f"id_image:{assessment_id}"
    id_raw = None
    if redis_client:
        try:
            print("\n===== 🔍 REDIS: Fetching ID Image =====")
            print(f"Key: {key}")

            id_raw = redis_client.get(key)

            if id_raw:
                print(f"✅ Found ID image in Redis. Byte length: {len(id_raw)}")
                ttl_left = redis_client.ttl(key)
                print(f"TTL remaining: {ttl_left} seconds")
            else:
                print("❌ Redis returned NULL — ID not found.")

            print("========================================\n")

        except Exception as e:
            print(f"❌ Redis GET failed: {e}")
            id_raw = None


    if id_raw is None:
        print("🔁 Redis returned no data — trying filesystem fallback...")

        p = FALLBACK_DIR / f"{assessment_id}.jpg"
        if p.exists():
            print(f"📁 Fallback file FOUND at {p}")
            with open(p, "rb") as f:
                id_raw = f.read()
            print(f"📁 Loaded fallback image. Byte length: {len(id_raw)}")
        else:
            print(f"❌ No fallback file found at {p}")


    if id_raw is None:
        raise HTTPException(status_code=404, detail="ID image not found for this assessmentId. Upload ID first.")

    # Save both to temp files
    id_path = _save_bytes_to_temp_file(id_raw, suffix=".jpg")
    selfie_path = _save_bytes_to_temp_file(selfie_raw, suffix=".jpg")

    try:
        # Run DeepFace verification
        # model_name and detector_backend can be tuned as needed
        result = DeepFace.verify(
            img1_path=id_path,
            img2_path=selfie_path,
            model_name="Facenet",
            detector_backend="opencv",
            distance_metric="cosine"
        )

        distance = result.get("distance")
        threshold = result.get("threshold")
        verified = result.get("verified", False)
        model = result.get("model", "unknown")

        confidence = None
        inverted_confidence = None
        if distance is not None and threshold is not None:
            confidence = _compute_confidence(distance, threshold)
            if confidence is not None:
                if verified:
                    # confidence is "same person" certainty
                    pass
                else:
                    # invert for "different person" case - how sure we are they are different
                    inverted_confidence = round(100.0 - confidence, 2)

        response_payload = {
            "success": True,
            "model": model,
            "verified": verified,
            "distance": distance,
            "threshold": threshold,
            "confidence_same_person_percent": confidence if verified else None,
            "confidence_different_person_percent": inverted_confidence if not verified else None,
            "raw_result": result
        }

        # (Optional) remove the ID image from cache after verification to avoid reuse
        try:
            if redis_client:
                print(f"🗑️ Deleting Redis key after verification: {key}")
                redis_client.delete(key)
            else:
                # remove fallback file
                p = FALLBACK_DIR / f"{assessment_id}.jpg"
                if p.exists():
                    p.unlink()
        except Exception:
            pass

        return response_payload

    except Exception as e:
        print("⚠️ DeepFace error:", e)
        raise HTTPException(status_code=500, detail=f"Face verification error: {e}")

    finally:
        # remove temp files
        try:
            os.remove(id_path)
        except Exception:
            pass
        try:
            os.remove(selfie_path)
        except Exception:
            pass


@app.get("/health")
async def health():
    return {"ok": True, "redis_connected": bool(redis_client)}
