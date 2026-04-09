# main.py
import os
import base64
import tempfile
import math
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from deepface import DeepFace
import redis

load_dotenv()

# ─── Configuration ────────────────────────────────────────────
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_TTL_SECONDS = int(os.getenv("REDIS_TTL_SECONDS", 3600))  # 1 hour
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "true").lower() in ("1", "true", "yes")
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", 10 * 1024 * 1024))  # 10MB

FALLBACK_DIR = Path(os.getenv("FALLBACK_DIR", "./id_cache"))
FALLBACK_DIR.mkdir(parents=True, exist_ok=True)

# ─── App setup ────────────────────────────────────────────────
app = FastAPI(title="ID Verification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Redis setup ──────────────────────────────────────────────
redis_client = None
if REDIS_ENABLED:
    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=False,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        redis_client.ping()
        print(f"✅ Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        print("⚠️ Falling back to filesystem cache.")
        redis_client = None
else:
    print("ℹ️ Redis disabled via REDIS_ENABLED=false — using filesystem fallback")


# ─── Pydantic models ─────────────────────────────────────────
class UploadIDRequest(BaseModel):
    assessmentId: str
    imageBase64: str


class VerifySelfieRequest(BaseModel):
    assessmentId: str
    selfieBase64: str


# ─── Helpers ─────────────────────────────────────────────────
def _strip_data_prefix(b64str: str) -> str:
    """Remove data:image/...;base64, prefix if present."""
    if b64str.startswith("data:"):
        return b64str.split(",", 1)[1]
    return b64str


def _decode_base64_image(b64str: str, field_name: str) -> bytes:
    """Decode base64 string to bytes with validation."""
    b64 = _strip_data_prefix(b64str)
    try:
        raw = base64.b64decode(b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 for {field_name}: {e}")

    if len(raw) == 0:
        raise HTTPException(status_code=400, detail=f"{field_name} image is empty.")

    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"{field_name} too large. Max allowed: {MAX_IMAGE_BYTES // (1024*1024)}MB."
        )
    return raw


def _save_bytes_to_temp_file(b: bytes, suffix: str = ".jpg") -> str:
    """Write bytes to a temp file and return the path."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    with open(path, "wb") as f:
        f.write(b)
    return path


def _compute_confidence(distance: float, threshold: float) -> float:
    """Sigmoid-based confidence score mapping distance to 0-100%."""
    try:
        confidence = 100.0 / (1.0 + math.exp(10.0 * (distance - threshold)))
        return round(confidence, 2)
    except Exception:
        return None


def _store_id_image(assessment_id: str, raw: bytes) -> dict:
    """Store ID image in Redis or filesystem fallback."""
    key = f"id_image:{assessment_id}"

    if redis_client:
        try:
            print(f"\n===== 📥 REDIS: Saving ID Image =====")
            print(f"Key: {key} | Size: {len(raw)} bytes | TTL: {REDIS_TTL_SECONDS}s")
            redis_client.setex(key, REDIS_TTL_SECONDS, raw)
            ttl_check = redis_client.ttl(key)
            print(f"✅ Saved to Redis. TTL = {ttl_check}s\n")
            return {"success": True, "method": "redis", "ttl_seconds": REDIS_TTL_SECONDS}
        except Exception as e:
            print(f"❌ Redis SET failed: {e} — falling back to filesystem.")

    # Filesystem fallback
    try:
        p = FALLBACK_DIR / f"{assessment_id}.jpg"
        with open(p, "wb") as f:
            f.write(raw)
        print(f"✅ Saved to filesystem: {p}")
        return {"success": True, "method": "filesystem", "path": str(p)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store ID image: {e}")


def _retrieve_id_image(assessment_id: str) -> bytes:
    """Retrieve ID image from Redis or filesystem fallback. Raises 404 if not found."""
    key = f"id_image:{assessment_id}"
    id_raw = None

    if redis_client:
        try:
            print(f"\n===== 🔍 REDIS: Fetching ID Image =====")
            print(f"Key: {key}")
            id_raw = redis_client.get(key)
            if id_raw:
                ttl_left = redis_client.ttl(key)
                print(f"✅ Found in Redis. Size: {len(id_raw)} bytes | TTL left: {ttl_left}s\n")
            else:
                print("❌ Redis returned NULL — key not found.\n")
        except Exception as e:
            print(f"❌ Redis GET failed: {e}")
            id_raw = None

    if id_raw is None:
        print("🔁 Trying filesystem fallback...")
        p = FALLBACK_DIR / f"{assessment_id}.jpg"
        if p.exists():
            with open(p, "rb") as f:
                id_raw = f.read()
            print(f"📁 Loaded from filesystem: {p} ({len(id_raw)} bytes)")
        else:
            print(f"❌ No fallback file found at {p}")

    if id_raw is None:
        raise HTTPException(
            status_code=404,
            detail="ID image not found for this assessmentId. Please upload ID first."
        )

    return id_raw


def _delete_id_image(assessment_id: str):
    """Delete ID image from Redis or filesystem after verification."""
    key = f"id_image:{assessment_id}"
    try:
        if redis_client:
            redis_client.delete(key)
            print(f"🗑️ Deleted Redis key: {key}")
        else:
            p = FALLBACK_DIR / f"{assessment_id}.jpg"
            if p.exists():
                p.unlink()
                print(f"🗑️ Deleted fallback file: {p}")
    except Exception as e:
        print(f"⚠️ Cleanup failed (non-critical): {e}")


# ─── Routes ──────────────────────────────────────────────────
@app.post("/upload-id")
async def upload_id(payload: UploadIDRequest):
    """
    Store a candidate's ID image keyed by assessmentId.
    Accepts base64-encoded image (with or without data URI prefix).
    """
    if not payload.assessmentId or not payload.assessmentId.strip():
        raise HTTPException(status_code=400, detail="assessmentId is required")

    raw = _decode_base64_image(payload.imageBase64, "ID image")
    return _store_id_image(payload.assessmentId.strip(), raw)


@app.post("/verify-selfie")
async def verify_selfie(payload: VerifySelfieRequest):
    """
    Verify a candidate selfie against their stored ID image using DeepFace.
    Keep the stored ID image for retries and delete it only after a successful match.
    """
    if not payload.assessmentId or not payload.assessmentId.strip():
        raise HTTPException(status_code=400, detail="assessmentId is required")

    assessment_id = payload.assessmentId.strip()
    selfie_raw = _decode_base64_image(payload.selfieBase64, "Selfie image")

    # Retrieve stored ID image (raises 404 if missing)
    id_raw = _retrieve_id_image(assessment_id)

    # Write both images to temp files for DeepFace
    id_path = _save_bytes_to_temp_file(id_raw, suffix=".jpg")
    selfie_path = _save_bytes_to_temp_file(selfie_raw, suffix=".jpg")

    verified = False
    try:
        print(f"🔍 Running DeepFace verification for assessmentId: {assessment_id}")
        result = DeepFace.verify(
            img1_path=id_path,
            img2_path=selfie_path,
            model_name="Facenet",
            detector_backend="opencv",
            distance_metric="cosine",
            enforce_detection=True,
        )

        distance = result.get("distance")
        threshold = result.get("threshold")
        verified = result.get("verified", False)
        model = result.get("model", "Facenet")

        confidence = _compute_confidence(distance, threshold) if distance is not None and threshold is not None else None
        inverted_confidence = round(100.0 - confidence, 2) if confidence is not None and not verified else None

        print(f"{'✅ VERIFIED' if verified else '❌ NOT VERIFIED'} | distance={distance:.4f} | threshold={threshold:.4f} | confidence={confidence}%")

        return {
            "success": True,
            "model": model,
            "verified": verified,
            "distance": distance,
            "threshold": threshold,
            "confidence_same_person_percent": confidence if verified else None,
            "confidence_different_person_percent": inverted_confidence if not verified else None,
            "raw_result": result,
        }

    except Exception as e:
        print(f"⚠️ DeepFace error for {assessment_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Face verification error: {e}")

    finally:
        # Always clean up temp files
        for path in [id_path, selfie_path]:
            try:
                os.remove(path)
            except Exception:
                pass

        # Allow retakes: delete only after a successful verification
        if verified:
            _delete_id_image(assessment_id)


@app.get("/health")
async def health():
    """Health check — returns Redis connectivity status."""
    redis_ok = False
    if redis_client:
        try:
            redis_client.ping()
            redis_ok = True
        except Exception:
            redis_ok = False

    return {
        "ok": True,
        "service": "ID Verification Service",
        "redis_connected": redis_ok,
        "redis_enabled": REDIS_ENABLED,
        "fallback_dir": str(FALLBACK_DIR),
    }
