#!/usr/bin/env python3
"""
Headless Video Analysis for Interview Proctoring
Modified from FMDv10_2.py to run without GUI
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


class EmotionAttentionAnalytics:
    def __init__(self):
        # MediaPipe setup
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        # Analytics data
        self.emotion_history = deque(maxlen=100)
        self.look_away_events = []
        self.emotion_counts = defaultdict(int)
        self.current_emotion = "neutral"
        self.emotion_confidence = 0.0
        self.is_looking_away = False
        self.look_away_count = 0
        self.current_face_count = 0
        self.multiple_faces_count = 0
        self.total_frames = 0
        self.session_start_time = time.time()

    def calculate_ear(self, landmarks, eye_indices):
        """Calculate Eye Aspect Ratio"""
        try:
            points = [landmarks.landmark[i] for i in eye_indices]

            # Vertical distances
            v1 = np.linalg.norm(
                np.array([points[1].x, points[1].y])
                - np.array([points[5].x, points[5].y])
            )
            v2 = np.linalg.norm(
                np.array([points[2].x, points[2].y])
                - np.array([points[4].x, points[4].y])
            )

            # Horizontal distance
            h = np.linalg.norm(
                np.array([points[0].x, points[0].y])
                - np.array([points[3].x, points[3].y])
            )

            ear = (v1 + v2) / (2.0 * h)
            return ear
        except:
            return 0.3

    def detect_emotion(self, landmarks):
        """Simple emotion detection based on facial landmarks"""
        try:
            # Get key facial points
            mouth_top = landmarks.landmark[13].y
            mouth_bottom = landmarks.landmark[14].y
            left_eye = landmarks.landmark[159].y
            right_eye = landmarks.landmark[386].y

            mouth_open = abs(mouth_bottom - mouth_top)

            # Simple emotion rules
            if mouth_open > 0.03:
                self.current_emotion = "surprised"
                self.emotion_confidence = 0.7
            elif mouth_top < mouth_bottom - 0.01:
                self.current_emotion = "happy"
                self.emotion_confidence = 0.6
            else:
                self.current_emotion = "neutral"
                self.emotion_confidence = 0.8

            return self.current_emotion, self.emotion_confidence
        except:
            return "neutral", 0.5

    def detect_attention(self, landmarks, frame_width, frame_height):
        """Detect if person is looking away"""
        try:
            # Eye indices for MediaPipe Face Mesh
            LEFT_EYE = [33, 160, 158, 133, 153, 144]
            RIGHT_EYE = [362, 385, 387, 263, 373, 380]

            # Calculate EAR
            left_ear = self.calculate_ear(landmarks, LEFT_EYE)
            right_ear = self.calculate_ear(landmarks, RIGHT_EYE)
            avg_ear = (left_ear + right_ear) / 2.0

            # Get nose tip position (landmark 1)
            nose_tip = landmarks.landmark[1]
            nose_x = nose_tip.x * frame_width

            # Check if looking away (nose position relative to frame center)
            center_x = frame_width / 2
            deviation = abs(nose_x - center_x) / frame_width

            # Looking away if nose deviates significantly or eyes partially closed
            was_looking_away = self.is_looking_away
            self.is_looking_away = deviation > 0.25 or avg_ear < 0.2

            # Count new look away events
            if self.is_looking_away and not was_looking_away:
                self.look_away_count += 1
                self.look_away_events.append(
                    {
                        "timestamp": time.time() - self.session_start_time,
                        "frame": self.total_frames,
                    }
                )

            return self.is_looking_away
        except Exception as e:
            return False

    def update_analytics(self, results, frame):
        """Update analytics with current frame data"""
        self.total_frames += 1

        if results.multi_face_landmarks:
            self.current_face_count = len(results.multi_face_landmarks)

            # Count multiple faces
            if self.current_face_count > 1:
                self.multiple_faces_count += 1

            # Analyze first face only
            face_landmarks = results.multi_face_landmarks[0]

            # Emotion detection
            emotion, confidence = self.detect_emotion(face_landmarks)
            self.emotion_history.append(emotion)
            self.emotion_counts[emotion] += 1

            # Attention detection
            frame_height, frame_width = frame.shape[:2]
            self.detect_attention(face_landmarks, frame_width, frame_height)
        else:
            self.current_face_count = 0

    def generate_report(self):
        """Generate final analytics report"""
        session_duration = time.time() - self.session_start_time

        # Calculate emotion distribution
        total_emotion_frames = sum(self.emotion_counts.values())
        emotion_distribution = {}
        if total_emotion_frames > 0:
            for emotion, count in self.emotion_counts.items():
                emotion_distribution[emotion] = round(
                    (count / total_emotion_frames) * 100, 2
                )

        # Find dominant emotion
        dominant_emotion = (
            max(self.emotion_counts.items(), key=lambda x: x[1])[0]
            if self.emotion_counts
            else "unknown"
        )

        # Calculate attention rate
        frames_looking_away = len(self.look_away_events)
        attention_rate = (
            100 - ((frames_looking_away / self.total_frames) * 100)
            if self.total_frames > 0
            else 0
        )

        report = {
            "session_info": {
                "duration_seconds": round(session_duration, 2),
                "frames_processed": self.total_frames,
                "analysis_timestamp": datetime.now().isoformat(),
            },
            "face_detection": {
                "multiple_faces_flag_count": self.multiple_faces_count,
                "average_face_count": (
                    round(self.current_face_count, 2) if self.total_frames > 0 else 0
                ),
            },
            "emotion_analysis": {
                "dominant_emotion": dominant_emotion,
                "emotion_distribution_percent": emotion_distribution,
                "total_emotion_frames": total_emotion_frames,
            },
            "attention_metrics": {
                "look_away_count": self.look_away_count,
                "attention_rate_percent": round(attention_rate, 2),
                "look_away_events": self.look_away_events[
                    :50
                ],  # Limit to first 50 events
            },
            "violations_summary": {
                "total_violations": self.look_away_count + self.multiple_faces_count,
                "critical_violations": self.multiple_faces_count,
                "violation_breakdown": {
                    "multiple_faces": self.multiple_faces_count,
                    "look_away": self.look_away_count,
                },
            },
        }

        return report


def analyze_video(video_path, output_json_path=None, assessment_id=None):
    """
    Analyze video file and generate report

    Args:
        video_path: Path to video file
        output_json_path: Where to save JSON report (optional)
        assessment_id: Assessment ID for tracking (optional)

    Returns:
        dict: Analysis report
    """
    print(f"Starting video analysis...")
    print(f"Video: {video_path}")

    # Initialize analytics
    analytics = EmotionAttentionAnalytics()

    # Open video
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return {"error": f"Could not open video file: {video_path}", "success": False}

    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0

    print(
        f"Video properties: {frame_count} frames, {fps:.2f} FPS, {duration:.2f} seconds"
    )

    # Process video
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

            # Show progress every 100 frames
            if frame_number % 100 == 0:
                progress = (frame_number / frame_count) * 100 if frame_count > 0 else 0
                print(
                    f"Progress: {progress:.1f}% ({frame_number}/{frame_count} frames)"
                )

            # Process frame
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            analytics.update_analytics(results, frame)

    cap.release()

    print("Video processing complete. Generating report...")

    # Generate report
    report = analytics.generate_report()
    report["assessment_id"] = assessment_id
    report["video_path"] = video_path
    report["success"] = True

    # Save to file if path provided
    if output_json_path:
        with open(output_json_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Report saved to: {output_json_path}")

    return report


def main():
    parser = argparse.ArgumentParser(
        description="Headless Video Analysis for Interview Proctoring"
    )
    parser.add_argument("video_path", help="Path to video file")
    parser.add_argument("--output", "-o", help="Output JSON file path", default=None)
    parser.add_argument("--assessment-id", "-a", help="Assessment ID", default=None)

    args = parser.parse_args()

    # Run analysis
    report = analyze_video(args.video_path, args.output, args.assessment_id)

    # Print summary
    if report.get("success"):
        print("\n" + "=" * 60)
        print("ANALYSIS SUMMARY")
        print("=" * 60)
        print(f"Duration: {report['session_info']['duration_seconds']:.1f}s")
        print(f"Frames Processed: {report['session_info']['frames_processed']}")
        print(
            f"\nMultiple Faces Detected: {report['face_detection']['multiple_faces_flag_count']} times"
        )
        print(f"Look Away Count: {report['attention_metrics']['look_away_count']}")
        print(
            f"Attention Rate: {report['attention_metrics']['attention_rate_percent']:.1f}%"
        )
        print(f"Dominant Emotion: {report['emotion_analysis']['dominant_emotion']}")
        print(f"\nTotal Violations: {report['violations_summary']['total_violations']}")
        print("=" * 60)
    else:
        print(f"\nError: {report.get('error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
