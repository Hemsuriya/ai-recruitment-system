#!/usr/bin/env python3
"""
Flask API for Video Analysis Service
Receives video analysis requests and returns JSON reports
"""

import os
import tempfile
import traceback
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

from video_analysis_headless import analyze_video

# ─── App setup ────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ─── Configuration ────────────────────────────────────────────
TEMP_DIR = tempfile.gettempdir()
MAX_VIDEO_SIZE_MB = int(os.getenv("MAX_VIDEO_SIZE_MB", 500))
DOWNLOAD_TIMEOUT = int(os.getenv("DOWNLOAD_TIMEOUT", 300))

DOWNLOAD_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}


# ─── Helpers ─────────────────────────────────────────────────
def _build_download_url(video_url: str) -> str:
    """
    Construct the correct download URL based on the OneDrive/SharePoint link type.
    Raises ValueError if no URL can be constructed.
    """
    if not video_url:
        raise ValueError("No video URL provided.")

    if "sharepoint.com" in video_url or "_layouts/15/download.aspx" in video_url:
        print("✅ Using authenticated Microsoft Graph download URL...")
        return video_url

    if "onedrive.live.com" in video_url:
        print("Using OneDrive sharing link...")
        url = video_url.replace("/view?", "/download?")
        url = url.replace("/embed?", "/download?")
        url = url.replace("?resid=", "/download?resid=")
        return url

    if "1drv.ms" in video_url:
        print("Using OneDrive short link...")
        return video_url + "?download=1"

    # Generic fallback
    print("Using generic URL with download parameter...")
    separator = "&" if "?" in video_url else "?"
    return video_url + separator + "download=1"


def _validate_video_file(temp_path: str) -> None:
    """
    Validate the downloaded file is a real video and not an error page.
    Raises Exception if invalid.
    """
    if not os.path.exists(temp_path):
        raise Exception("File was not created during download.")

    file_size = os.path.getsize(temp_path)

    if file_size == 0:
        raise Exception("Downloaded file is empty (0 bytes).")

    with open(temp_path, "rb") as f:
        header = f.read(500)

    # Reject HTML error pages
    header_lower = header.lower()
    if b"<html" in header_lower or b"<!doctype" in header_lower:
        os.remove(temp_path)
        raise Exception(
            "Downloaded file is an HTML error page, not a video. "
            "The download URL may have expired or authentication failed."
        )

    if file_size < 1000:
        raise Exception(f"Downloaded file is too small ({file_size} bytes) — likely invalid.")

    # Check magic bytes for WebM / MP4
    magic = header[:16]
    is_webm = magic[0:4] == b"\x1a\x45\xdf\xa3"
    is_mp4 = b"ftyp" in magic[4:12]

    if not (is_webm or is_mp4):
        print(f"⚠️  Warning: File doesn't appear to be WebM or MP4. Magic bytes: {magic.hex()}")
        print("   Continuing anyway — OpenCV will determine if it's readable.")


def download_video_from_onedrive(video_url: str, drive_id: str, assessment_id: str) -> str | None:
    """
    Download a video from OneDrive/SharePoint to a local temp file.

    Args:
        video_url:     Direct or sharing URL to the video file
        drive_id:      OneDrive file ID (used for temp filename)
        assessment_id: Assessment ID (used for temp filename)

    Returns:
        Local path to downloaded file, or None on failure.
    """
    try:
        download_url = _build_download_url(video_url)

        safe_drive_id = (drive_id or "unknown")[:8]
        temp_filename = f"{assessment_id}_{safe_drive_id}.webm"
        temp_path = os.path.join(TEMP_DIR, temp_filename)

        print(f"📥 Download URL: {download_url[:120]}{'...' if len(download_url) > 120 else ''}")
        print(f"💾 Saving to:    {temp_path}")
        print("🔄 Initiating download...")

        response = requests.get(
            download_url,
            stream=True,
            timeout=DOWNLOAD_TIMEOUT,
            headers=DOWNLOAD_HEADERS,
            allow_redirects=True,
        )
        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        content_length = response.headers.get("content-length", "")
        print(f"📄 Content-Type: {content_type}")
        if content_length.isdigit():
            print(f"📏 Content-Length: {int(content_length) / (1024 * 1024):.2f} MB")
        else:
            print("📏 Content-Length: Unknown")

        # Early reject if server returned HTML
        if "text/html" in content_type:
            first_chunk = response.raw.read(500)
            lower = first_chunk.lower()
            if b"<html" in lower or b"<!doctype" in lower:
                raise Exception(
                    "Server returned an HTML page instead of a video file.\n"
                    "Possible causes:\n"
                    "  1. Microsoft Graph download URL has expired (~1 hour TTL)\n"
                    "  2. Authentication / permissions issue\n"
                    "Please re-upload the video and use a fresh URL."
                )

        # Stream to disk
        total_size = 0
        chunk_count = 0
        max_bytes = MAX_VIDEO_SIZE_MB * 1024 * 1024

        with open(temp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                f.write(chunk)
                total_size += len(chunk)
                chunk_count += 1

                if total_size > max_bytes:
                    f.close()
                    os.remove(temp_path)
                    raise Exception(
                        f"Video exceeds maximum allowed size of {MAX_VIDEO_SIZE_MB}MB."
                    )

                if chunk_count % 1000 == 0:
                    print(f"   Downloaded: {total_size / (1024 * 1024):.2f} MB...")

        print(f"✅ Download complete: {total_size / (1024 * 1024):.2f} MB")

        _validate_video_file(temp_path)
        print(f"✅ Video file validated: {os.path.getsize(temp_path) / (1024 * 1024):.2f} MB")

        return temp_path

    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response is not None else "unknown"
        body = e.response.text[:500] if e.response is not None else ""
        print(f"❌ HTTP {status} error downloading video: {e}")
        print(f"   Response body: {body}")
        traceback.print_exc()
        return None

    except requests.exceptions.Timeout:
        print(f"❌ Download timed out after {DOWNLOAD_TIMEOUT}s.")
        traceback.print_exc()
        return None

    except Exception as e:
        print(f"❌ Error downloading video: {e}")
        traceback.print_exc()
        return None


def _cleanup(path: str) -> None:
    """Silently delete a file if it exists."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
            print(f"🗑️  Cleaned up: {path}")
    except Exception as e:
        print(f"⚠️  Cleanup failed (non-critical): {e}")


# ─── Routes ──────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "Video Analysis API",
        "version": "1.1",
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/analyze", methods=["POST"])
def analyze_video_endpoint():
    """
    Analyze a candidate interview video from OneDrive.

    Request body:
    {
        "video_url":       "https://sharepoint.com/...",   # required (or video_drive_id)
        "video_drive_id":  "abc123...",                    # optional
        "assessment_id":   "video_1761538786278_evvrm2una",# required
        "candidate_name":  "John Doe",                     # optional
        "candidate_email": "john@example.com"              # optional
    }
    """
    video_path = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "No JSON body provided"}), 400

        video_url = (data.get("video_url") or "").strip()
        video_drive_id = (data.get("video_drive_id") or "").strip()
        assessment_id = (data.get("assessment_id") or "").strip()
        candidate_name = (data.get("candidate_name") or "Unknown").strip()
        candidate_email = (data.get("candidate_email") or "Unknown").strip()

        # ── Validation ──────────────────────────────────────
        if not assessment_id:
            return jsonify({"success": False, "error": "Missing required field: assessment_id"}), 400

        if not video_url and not video_drive_id:
            return jsonify({"success": False, "error": "Missing required field: video_url or video_drive_id"}), 400

        print(f"\n{'='*60}")
        print(f"📋 New Analysis Request")
        print(f"{'='*60}")
        print(f"Assessment ID : {assessment_id}")
        print(f"Candidate     : {candidate_name} ({candidate_email})")
        print(f"Drive ID      : {video_drive_id or 'N/A'}")
        print(f"Video URL     : {video_url[:100]}{'...' if len(video_url) > 100 else ''}")
        print(f"{'='*60}\n")

        # ── Step 1: Download ─────────────────────────────────
        print("Step 1: Downloading video from OneDrive...")
        video_path = download_video_from_onedrive(video_url, video_drive_id, assessment_id)

        if not video_path or not os.path.exists(video_path):
            return jsonify({
                "success": False,
                "error": "Failed to download video from OneDrive.",
                "details": "File could not be downloaded or was empty. Check URL validity and permissions.",
            }), 500

        file_mb = os.path.getsize(video_path) / (1024 * 1024)
        print(f"✅ Video downloaded: {video_path} ({file_mb:.2f} MB)\n")

        # ── Step 2: Analyse ──────────────────────────────────
        print("Step 2: Running video analysis...")
        report = analyze_video(
            video_path=video_path,
            output_json_path=None,
            assessment_id=assessment_id,
        )

        if not report.get("success"):
            return jsonify({
                "success": False,
                "error": report.get("error", "Unknown analysis error"),
            }), 500

        # ── Step 3: Enrich & return ──────────────────────────
        report["candidate_name"] = candidate_name
        report["candidate_email"] = candidate_email

        violations = report["violations_summary"]["total_violations"]
        attention = report["attention_metrics"]["attention_rate_percent"]
        emotion = report["emotion_analysis"]["dominant_emotion"]

        print("✅ Step 3: Analysis complete!")
        print(f"   Total Violations : {violations}")
        print(f"   Attention Rate   : {attention:.1f}%")
        print(f"   Dominant Emotion : {emotion}\n")

        return jsonify({
            "success": True,
            "assessment_id": assessment_id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "report": report,
            "message": "Video analysis completed successfully",
        }), 200

    except Exception as e:
        stack_trace = traceback.format_exc()
        print(f"\n❌ Unhandled error during analysis:\n{stack_trace}")
        return jsonify({
            "success": False,
            "error": str(e),
            "stack_trace": stack_trace,
        }), 500

    finally:
        _cleanup(video_path)


@app.route("/test-download", methods=["POST"])
def test_download():
    """Test endpoint to verify an OneDrive URL is downloadable."""
    video_path = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "No JSON body provided"}), 400

        video_url = (data.get("video_url") or "").strip()
        drive_id = (data.get("video_drive_id") or "test").strip()

        if not video_url:
            return jsonify({"success": False, "error": "Missing video_url"}), 400

        print(f"\n{'='*60}\nTEST DOWNLOAD\n{'='*60}")

        video_path = download_video_from_onedrive(video_url, drive_id, "test")

        if not video_path or not os.path.exists(video_path):
            return jsonify({"success": False, "message": "Download failed — file not created"}), 500

        file_size = os.path.getsize(video_path)
        is_valid = file_size > 1000
        file_mb = round(file_size / (1024 * 1024), 2)

        print(f"Result    : {'SUCCESS' if is_valid else 'FAILED'}")
        print(f"File size : {file_mb} MB\n")

        return jsonify({
            "success": is_valid,
            "message": "Download successful" if is_valid else "File too small or invalid",
            "file_size_mb": file_mb,
            "file_size_bytes": file_size,
        })

    except Exception as e:
        print(f"❌ Test download error: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        _cleanup(video_path)


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🎥 Video Analysis API Server")
    print("=" * 60)
    print("  GET  /health         — Health check")
    print("  POST /analyze        — Analyze interview video")
    print("  POST /test-download  — Test OneDrive URL download")
    print("=" * 60)
    port = int(os.getenv("PORT", 5001))
    print(f"\n🚀 Starting on http://0.0.0.0:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")