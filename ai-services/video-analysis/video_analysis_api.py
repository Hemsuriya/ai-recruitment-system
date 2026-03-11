#!/usr/bin/env python3
"""
Flask API for Video Analysis Service
Receives video analysis requests and returns JSON reports
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import tempfile
import requests
from datetime import datetime
import traceback

# Import the analysis function from headless script
from video_analysis_headless import analyze_video

app = Flask(__name__)
CORS(app)  # Enable CORS for n8n webhooks

# Configuration
TEMP_DIR = tempfile.gettempdir()
MAX_VIDEO_SIZE_MB = 500  # Maximum video size allowed


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "healthy",
            "service": "Video Analysis API",
            "version": "1.0",
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.route("/analyze", methods=["POST"])
def analyze_video_endpoint():
    """
    Main endpoint for video analysis

    Expects JSON body:
    {
        "video_url": "https://sharepoint.com/...",
        "video_drive_id": "abc123...",
        "assessment_id": "video_1761538786278_evvrm2una",
        "candidate_name": "John Doe",
        "candidate_email": "john@example.com"
    }

    Returns:
    {
        "success": true,
        "assessment_id": "...",
        "report": { ... full analysis report ... }
    }
    """
    try:
        # Get request data
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        # Extract parameters
        video_url = data.get("video_url", "")
        video_drive_id = data.get("video_drive_id")
        assessment_id = data.get("assessment_id")
        candidate_name = data.get("candidate_name", "Unknown")
        candidate_email = data.get("candidate_email", "Unknown")

        if not assessment_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Missing required field: assessment_id",
                    }
                ),
                400,
            )

        if not video_url and not video_drive_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Missing required field: video_url or video_drive_id",
                    }
                ),
                400,
            )

        print(f"\n{'='*60}")
        print(f"New Analysis Request")
        print(f"{'='*60}")
        print(f"Assessment ID: {assessment_id}")
        print(f"Candidate: {candidate_name} ({candidate_email})")
        print(f"Drive ID: {video_drive_id}")
        print(
            f"Video URL: {video_url[:100]}..."
            if len(video_url) > 100
            else f"Video URL: {video_url}"
        )
        print(f"{'='*60}\n")

        # Download video from OneDrive
        print("Step 1: Downloading video from OneDrive...")
        video_path = download_video_from_onedrive(
            video_url, video_drive_id, assessment_id
        )

        if not video_path or not os.path.exists(video_path):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Failed to download video from OneDrive",
                        "details": "Video file could not be downloaded or is empty",
                    }
                ),
                500,
            )

        print(f"✅ Video downloaded: {video_path}")
        print(f"📊 File size: {os.path.getsize(video_path) / (1024*1024):.2f} MB\n")

        # Run analysis
        print("Step 2: Running video analysis...")
        report = analyze_video(
            video_path=video_path,
            output_json_path=None,  # Don't save to file, return directly
            assessment_id=assessment_id,
        )

        # Clean up downloaded video
        try:
            os.remove(video_path)
            print(f"🗑️  Cleaned up temporary file: {video_path}\n")
        except:
            pass

        # Check if analysis was successful
        if not report.get("success"):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": report.get("error", "Unknown analysis error"),
                    }
                ),
                500,
            )

        # Add candidate info to report
        report["candidate_name"] = candidate_name
        report["candidate_email"] = candidate_email

        print("✅ Step 3: Analysis complete!")
        print(
            f"   Total Violations: {report['violations_summary']['total_violations']}"
        )
        print(
            f"   Attention Rate: {report['attention_metrics']['attention_rate_percent']:.1f}%"
        )
        print(
            f"   Dominant Emotion: {report['emotion_analysis']['dominant_emotion']}\n"
        )

        return (
            jsonify(
                {
                    "success": True,
                    "assessment_id": assessment_id,
                    "candidate_name": candidate_name,
                    "candidate_email": candidate_email,
                    "report": report,
                    "message": "Video analysis completed successfully",
                }
            ),
            200,
        )

    except Exception as e:
        error_msg = str(e)
        stack_trace = traceback.format_exc()

        print(f"\n❌ ERROR during analysis:")
        print(error_msg)
        print(stack_trace)

        return (
            jsonify({"success": False, "error": error_msg, "stack_trace": stack_trace}),
            500,
        )


def download_video_from_onedrive(video_url, drive_id, assessment_id):
    """
    Download video from OneDrive using direct download link

    Args:
        video_url: The @microsoft.graph.downloadUrl from OneDrive upload (authenticated temporary link)
        drive_id: OneDrive file ID
        assessment_id: Assessment ID for naming

    Returns:
        str: Path to downloaded video file
    """
    try:
        download_url = None

        # Method 1: Direct download URL from Microsoft Graph (BEST - includes auth token)
        if video_url and (
            "sharepoint.com" in video_url or "_layouts/15/download.aspx" in video_url
        ):
            print("✅ Using authenticated download URL from Microsoft Graph...")
            download_url = video_url

        # Method 2: OneDrive sharing link
        elif video_url and "onedrive.live.com" in video_url:
            print("Using OneDrive sharing link...")
            download_url = video_url.replace("/view?", "/download?")
            download_url = download_url.replace("/embed?", "/download?")
            download_url = download_url.replace("?resid=", "/download?resid=")

        # Method 3: 1drv.ms short link
        elif video_url and "1drv.ms" in video_url:
            print("Using OneDrive short link...")
            download_url = video_url + "?download=1"

        # Method 4: Try generic download parameter
        elif video_url:
            print("Using provided URL with download parameter...")
            if "?" in video_url:
                download_url = video_url + "&download=1"
            else:
                download_url = video_url + "?download=1"
        else:
            raise Exception("No video URL provided. Cannot download video without URL.")

        if not download_url:
            raise Exception(
                "Could not construct download URL from provided information"
            )

        # Temporary file path
        temp_filename = (
            f"{assessment_id}_{drive_id[:8] if drive_id else 'unknown'}.webm"
        )
        temp_path = os.path.join(TEMP_DIR, temp_filename)

        print(f"📥 Download URL: {download_url[:100]}...")
        print(f"💾 Saving to: {temp_path}")

        # Download with streaming
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
        }

        # First request - may redirect
        print("🔄 Initiating download...")
        response = requests.get(
            download_url,
            stream=True,
            timeout=300,
            headers=headers,
            allow_redirects=True,
        )

        response.raise_for_status()

        # Check content type
        content_type = response.headers.get("content-type", "")
        content_length = response.headers.get("content-length", "0")

        print(f"📄 Content-Type: {content_type}")
        print(
            f"📏 Content-Length: {int(content_length) / (1024*1024):.2f} MB"
            if content_length.isdigit()
            else "Unknown size"
        )

        # Check if we got HTML instead of video
        if "text/html" in content_type:
            print("⚠️  Warning: Got HTML response instead of video file")

            # Read first 500 bytes to check
            first_chunk = response.raw.read(500)
            if b"<html" in first_chunk.lower() or b"<!doctype" in first_chunk.lower():
                raise Exception(
                    "Downloaded content is HTML, not a video file. "
                    "This usually means:\n"
                    "1. The download URL has expired (Microsoft Graph URLs expire after ~1 hour)\n"
                    "2. Authentication is required\n"
                    "3. File sharing permissions are incorrect\n"
                    "Please ensure the video is uploaded and URL is fresh."
                )

        # Save to temp file
        print("💾 Downloading video file...")
        total_size = 0
        chunk_count = 0

        with open(temp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    total_size += len(chunk)
                    chunk_count += 1

                    # Progress indicator every 1000 chunks (~8MB)
                    if chunk_count % 1000 == 0:
                        print(f"   Downloaded: {total_size / (1024*1024):.2f} MB...")

        print(f"✅ Download complete: {total_size / (1024*1024):.2f} MB")

        # Verify file was created and has content
        if not os.path.exists(temp_path):
            raise Exception("File was not created during download")

        file_size = os.path.getsize(temp_path)
        if file_size == 0:
            raise Exception("Downloaded file is empty (0 bytes)")

        if file_size < 1000:  # Less than 1KB is suspicious
            print(f"⚠️  Warning: File size is very small ({file_size} bytes)")
            # Read first few bytes to check if it's HTML
            with open(temp_path, "rb") as f:
                first_bytes = f.read(500)
                if (
                    b"<html" in first_bytes.lower()
                    or b"<!doctype" in first_bytes.lower()
                ):
                    # Clean up the bad file
                    os.remove(temp_path)
                    raise Exception(
                        "Downloaded file is HTML error page, not a video. "
                        "The download URL may have expired or authentication failed."
                    )

        # Verify it's actually a video file by checking magic bytes
        with open(temp_path, "rb") as f:
            magic_bytes = f.read(16)
            # WebM files start with 0x1A45DFA3
            # MP4 files have 'ftyp' at bytes 4-8
            is_webm = magic_bytes[0:4] == b"\x1a\x45\xdf\xa3"
            is_mp4 = b"ftyp" in magic_bytes[4:12]

            if not (is_webm or is_mp4):
                print(f"⚠️  Warning: File doesn't appear to be WebM or MP4 format")
                print(f"   Magic bytes: {magic_bytes.hex()}")
                # Don't fail - let OpenCV try to read it

        print(f"✅ Video file validated: {file_size / (1024*1024):.2f} MB")

        return temp_path

    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error downloading video: {e}")
        print(f"   Status Code: {e.response.status_code}")
        print(f"   Response: {e.response.text[:500]}")
        traceback.print_exc()
        return None

    except Exception as e:
        print(f"❌ Error downloading video: {e}")
        traceback.print_exc()
        return None


@app.route("/test-download", methods=["POST"])
def test_download():
    """Test endpoint to verify OneDrive download works"""
    try:
        data = request.get_json()
        video_url = data.get("video_url", "")
        drive_id = data.get("video_drive_id", "test")

        if not video_url:
            return jsonify({"error": "Missing video_url"}), 400

        print(f"\n{'='*60}")
        print("TEST DOWNLOAD")
        print(f"{'='*60}")

        video_path = download_video_from_onedrive(video_url, drive_id, "test")

        if video_path and os.path.exists(video_path):
            file_size = os.path.getsize(video_path)

            # Check if it's actually a video
            is_valid = file_size > 1000

            print(f"{'='*60}")
            print(f"Result: {'SUCCESS' if is_valid else 'FAILED'}")
            print(f"File size: {file_size / (1024*1024):.2f} MB")
            print(f"{'='*60}\n")

            os.remove(video_path)  # Clean up

            return jsonify(
                {
                    "success": is_valid,
                    "message": (
                        "Download successful"
                        if is_valid
                        else "Downloaded file is too small or invalid"
                    ),
                    "file_size_mb": round(file_size / (1024 * 1024), 2),
                    "file_size_bytes": file_size,
                }
            )
        else:
            return (
                jsonify(
                    {"success": False, "message": "Download failed - file not created"}
                ),
                500,
            )

    except Exception as e:
        print(f"❌ Test download error: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🎥 Video Analysis API Server")
    print("=" * 60)
    print("Endpoints:")
    print("  GET  /health          - Health check")
    print("  POST /analyze         - Analyze video")
    print("  POST /test-download   - Test OneDrive download")
    print("=" * 60)
    print("\n🚀 Starting server on http://0.0.0.0:5000")
    print("Press Ctrl+C to stop\n")

    app.run(host="0.0.0.0", port=5000, debug=True)
