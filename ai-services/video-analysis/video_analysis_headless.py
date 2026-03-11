#!/usr/bin/env python3
"""
Headless Video Analysis for Interview Proctoring
Runs without GUI — designed to be called by video_analysis_api.py or CLI
"""

import cv2
import mediapipe as mp
import numpy as np
import json
import sys
import argparse
from datetime import datetime
from collections import defaultdict, deque
import time


# ─── Constants ────────────────────────────────────────────────
LEFT_EYE_INDICES  = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

LOOK_AWAY_DEVIATION_THRESHOLD = 0.25   # nose deviation from center (fraction of width)
EAR_CLOSED_THRESHOLD          = 0.20   # below this = eyes too closed
MOUTH_OPEN_THRESHOLD          = 0.03   # mouth open ratio → surprised
MOUTH_SMILE_THRESHOLD         = 0.01   # mouth curve ratio → happy
PROGRESS_LOG_INTERVAL         = 100    # log progress every N frames


class EmotionAttentionAnalytics:
    def __init__(self):
        # MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh

        # Counters
        self.total_frames         = 0
        self.look_away_frames     = 0   # FIX: count frames, not events
        self.look_away_count      = 0   # distinct look-away transitions
        self.multiple_faces_count = 0
        self.no_face_frames       = 0

        # State
        self.is_looking_away  = False
        self.current_face_count = 0

        # Emotion tracking
        self.emotion_counts  = defaultdict(int)
        self.emotion_history = deque(maxlen=100)

        # Look-away event log (timestamp + frame)
        self.look_away_events = []

        self.session_start_time = time.time()

    # ─── EAR ─────────────────────────────────────────────────
    def calculate_ear(self, landmarks, eye_indices: list) -> float:
        """Calculate Eye Aspect Ratio for a given eye."""
        try:
            pts = [landmarks.landmark[i] for i in eye_indices]

            v1 = np.linalg.norm(
                np.array([pts[1].x, pts[1].y]) - np.array([pts[5].x, pts[5].y])
            )
            v2 = np.linalg.norm(
                np.array([pts[2].x, pts[2].y]) - np.array([pts[4].x, pts[4].y])
            )
            h = np.linalg.norm(
                np.array([pts[0].x, pts[0].y]) - np.array([pts[3].x, pts[3].y])
            )

            if h == 0:
                return 0.3
            return (v1 + v2) / (2.0 * h)
        except Exception:
            return 0.3

    # ─── Emotion ─────────────────────────────────────────────
    def detect_emotion(self, landmarks) -> tuple[str, float]:
        """
        Rule-based emotion detection using mouth landmark geometry.
        Returns (emotion_label, confidence).
        """
        try:
            mouth_top    = landmarks.landmark[13].y
            mouth_bottom = landmarks.landmark[14].y

            mouth_open  = abs(mouth_bottom - mouth_top)
            mouth_curve = mouth_top - mouth_bottom  # negative = open/smile

            if mouth_open > MOUTH_OPEN_THRESHOLD:
                return "surprised", 0.70
            elif mouth_curve < -MOUTH_SMILE_THRESHOLD:
                return "happy", 0.60
            else:
                return "neutral", 0.80
        except Exception:
            return "neutral", 0.50

    # ─── Attention ────────────────────────────────────────────
    def detect_attention(self, landmarks, frame_width: int, frame_height: int) -> bool:
        """
        Detect if the candidate is looking away using:
          - Nose tip horizontal deviation from frame centre
          - Average Eye Aspect Ratio (eyes too closed = not attentive)
        Returns True if looking away.
        """
        try:
            left_ear  = self.calculate_ear(landmarks, LEFT_EYE_INDICES)
            right_ear = self.calculate_ear(landmarks, RIGHT_EYE_INDICES)
            avg_ear   = (left_ear + right_ear) / 2.0

            nose_tip  = landmarks.landmark[1]
            nose_x    = nose_tip.x * frame_width
            center_x  = frame_width / 2
            deviation = abs(nose_x - center_x) / frame_width

            was_looking_away  = self.is_looking_away
            self.is_looking_away = deviation > LOOK_AWAY_DEVIATION_THRESHOLD or avg_ear < EAR_CLOSED_THRESHOLD

            # Record transition → new event
            if self.is_looking_away and not was_looking_away:
                self.look_away_count += 1
                self.look_away_events.append({
                    "timestamp": round(time.time() - self.session_start_time, 2),
                    "frame": self.total_frames,
                    "deviation": round(deviation, 4),
                    "avg_ear": round(avg_ear, 4),
                })

            return self.is_looking_away

        except Exception:
            return False

    # ─── Per-frame update ────────────────────────────────────
    def update_analytics(self, results, frame) -> None:
        """Process one video frame and update all analytics counters."""
        self.total_frames += 1

        if results.multi_face_landmarks:
            self.current_face_count = len(results.multi_face_landmarks)

            if self.current_face_count > 1:
                self.multiple_faces_count += 1

            # Only analyse the primary (first) face
            face_landmarks = results.multi_face_landmarks[0]

            emotion, _ = self.detect_emotion(face_landmarks)
            self.emotion_history.append(emotion)
            self.emotion_counts[emotion] += 1

            frame_height, frame_width = frame.shape[:2]
            self.detect_attention(face_landmarks, frame_width, frame_height)

            # FIX: count frames where candidate is inattentive
            if self.is_looking_away:
                self.look_away_frames += 1

        else:
            # No face detected → treat as inattentive
            self.current_face_count = 0
            self.no_face_frames    += 1
            self.look_away_frames  += 1

    # ─── Report ──────────────────────────────────────────────
    def generate_report(self) -> dict:
        """Compile all analytics into a structured report dict."""
        session_duration = time.time() - self.session_start_time

        # Emotion distribution
        total_emotion_frames = sum(self.emotion_counts.values())
        emotion_distribution = {
            emotion: round((count / total_emotion_frames) * 100, 2)
            for emotion, count in self.emotion_counts.items()
        } if total_emotion_frames > 0 else {}

        dominant_emotion = (
            max(self.emotion_counts.items(), key=lambda x: x[1])[0]
            if self.emotion_counts else "unknown"
        )

        # FIX: attention rate based on inattentive FRAMES, not event count
        attention_rate = (
            round(100 - ((self.look_away_frames / self.total_frames) * 100), 2)
            if self.total_frames > 0 else 0.0
        )

        return {
            "session_info": {
                "duration_seconds":    round(session_duration, 2),
                "frames_processed":    self.total_frames,
                "analysis_timestamp":  datetime.now().isoformat(),
            },
            "face_detection": {
                "multiple_faces_flag_count": self.multiple_faces_count,
                "no_face_frames":            self.no_face_frames,
                "average_face_count": round(
                    (self.total_frames - self.no_face_frames) / self.total_frames, 2
                ) if self.total_frames > 0 else 0,
            },
            "emotion_analysis": {
                "dominant_emotion":              dominant_emotion,
                "emotion_distribution_percent":  emotion_distribution,
                "total_emotion_frames":          total_emotion_frames,
            },
            "attention_metrics": {
                "look_away_count":        self.look_away_count,        # distinct events
                "look_away_frames":       self.look_away_frames,       # total inattentive frames
                "no_face_frames":         self.no_face_frames,
                "attention_rate_percent": attention_rate,
                "look_away_events":       self.look_away_events[:50],  # cap at 50
            },
            "violations_summary": {
                "total_violations":     self.look_away_count + self.multiple_faces_count,
                "critical_violations":  self.multiple_faces_count,
                "violation_breakdown": {
                    "multiple_faces": self.multiple_faces_count,
                    "look_away":      self.look_away_count,
                    "no_face":        self.no_face_frames,
                },
            },
        }


# ─── Main analysis function ───────────────────────────────────
def analyze_video(
    video_path: str,
    output_json_path: str | None = None,
    assessment_id: str | None = None,
) -> dict:
    """
    Analyse a video file and return a proctoring report.

    Args:
        video_path:       Path to local video file (WebM, MP4, etc.)
        output_json_path: If provided, saves report JSON to this path.
        assessment_id:    Identifier to embed in the report.

    Returns:
        dict with success=True and all report sections, or success=False + error.
    """
    print(f"\n{'='*60}")
    print(f"🎬 Starting video analysis")
    print(f"   File        : {video_path}")
    print(f"   Assessment  : {assessment_id or 'N/A'}")
    print(f"{'='*60}\n")

    analytics = EmotionAttentionAnalytics()

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "success": False,
            "error": f"Could not open video file: {video_path}",
            "assessment_id": assessment_id,
        }

    fps         = cap.get(cv2.CAP_PROP_FPS) or 25
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration    = frame_count / fps if fps > 0 else 0

    print(f"📊 Video properties: {frame_count} frames | {fps:.2f} FPS | {duration:.2f}s\n")

    try:
        with analytics.mp_face_mesh.FaceMesh(
            max_num_faces=5,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as face_mesh:

            frame_number = 0

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                frame_number += 1

                if frame_number % PROGRESS_LOG_INTERVAL == 0:
                    progress = (frame_number / frame_count * 100) if frame_count > 0 else 0
                    print(f"   Progress: {progress:.1f}% ({frame_number}/{frame_count} frames)")

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results   = face_mesh.process(rgb_frame)
                analytics.update_analytics(results, frame)

    except Exception as e:
        cap.release()
        return {
            "success":       False,
            "error":         f"Error during frame processing: {e}",
            "assessment_id": assessment_id,
        }
    finally:
        cap.release()

    print("\n✅ Video processing complete. Generating report...")

    report = analytics.generate_report()
    report["assessment_id"] = assessment_id
    report["video_path"]    = video_path
    report["success"]       = True

    if output_json_path:
        try:
            with open(output_json_path, "w") as f:
                json.dump(report, f, indent=2)
            print(f"💾 Report saved to: {output_json_path}")
        except Exception as e:
            print(f"⚠️  Could not save report to {output_json_path}: {e}")

    return report


# ─── CLI entry point ─────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Headless Video Analysis for Interview Proctoring"
    )
    parser.add_argument("video_path",       help="Path to video file")
    parser.add_argument("--output",    "-o", help="Output JSON file path", default=None)
    parser.add_argument("--assessment-id", "-a", help="Assessment ID",    default=None)
    args = parser.parse_args()

    report = analyze_video(args.video_path, args.output, args.assessment_id)

    if report.get("success"):
        print("\n" + "=" * 60)
        print("ANALYSIS SUMMARY")
        print("=" * 60)
        print(f"Duration         : {report['session_info']['duration_seconds']:.1f}s")
        print(f"Frames Processed : {report['session_info']['frames_processed']}")
        print(f"No-Face Frames   : {report['face_detection']['no_face_frames']}")
        print(f"Multiple Faces   : {report['face_detection']['multiple_faces_flag_count']} times")
        print(f"Look Away Events : {report['attention_metrics']['look_away_count']}")
        print(f"Look Away Frames : {report['attention_metrics']['look_away_frames']}")
        print(f"Attention Rate   : {report['attention_metrics']['attention_rate_percent']:.1f}%")
        print(f"Dominant Emotion : {report['emotion_analysis']['dominant_emotion']}")
        print(f"Total Violations : {report['violations_summary']['total_violations']}")
        print("=" * 60)
    else:
        print(f"\n❌ Error: {report.get('error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()