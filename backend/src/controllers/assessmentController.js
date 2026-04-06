const db = require("../config/db");

// GET assessment questions for a candidate (by screening_id)
exports.getAssessmentQuestions = async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Fetch candidate info
    const candidate = await db.query(
      "SELECT screening_id, name, email, job_title, match_score, technical_assessment_unlocked, survey_validation_status FROM candidates_v2 WHERE screening_id = $1",
      [candidateId]
    );

    if (candidate.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Fetch MCQ questions from assessment_questions_v2
    const questions = await db.query(
      "SELECT question_id, question_text, options, category, difficulty, time_limit FROM assessment_questions_v2 WHERE screening_id = $1 ORDER BY question_id",
      [candidateId]
    );

    // Fetch job requirements
    const jobReqs = await db.query(
      "SELECT job_title, required_skills, experience_level, time_limit, difficulty FROM job_requirements_v2 WHERE screening_id = $1 LIMIT 1",
      [candidateId]
    );

    res.status(200).json({
      success: true,
      data: {
        candidate: candidate.rows[0],
        questions: questions.rows.map((q) => ({
          id: q.question_id,
          question_text: q.question_text,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
          category: q.category,
          difficulty: q.difficulty,
          time_limit: q.time_limit,
        })),
        jobRequirements: jobReqs.rows[0] || null,
        totalQuestions: questions.rows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching assessment questions:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assessment questions",
    });
  }
};

// UPDATE assessment status
exports.updateAssessmentStatus = async (req, res) => {
  try {
    const { candidateId, status } = req.body;

    const result = await db.query(
      "UPDATE candidates_v2 SET status = $1 WHERE screening_id = $2 RETURNING screening_id, status",
      [status, candidateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating assessment status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update assessment status",
    });
  }
};

// SUBMIT assessment results
exports.submitAssessmentResults = async (req, res) => {
  try {
    const { screening_id, answers, time_taken_seconds } = req.body;

    if (!screening_id || !answers) {
      return res.status(400).json({
        success: false,
        message: "screening_id and answers are required",
      });
    }

    // Fetch correct answers
    const questions = await db.query(
      "SELECT question_id, correct_answer FROM assessment_questions_v2 WHERE screening_id = $1",
      [screening_id]
    );

    if (questions.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this candidate",
      });
    }

    // Score the answers
    let correctCount = 0;
    const totalQuestions = questions.rows.length;
    const questionScores = {};

    questions.rows.forEach((q) => {
      const candidateAnswer = answers[q.question_id];
      const isCorrect = candidateAnswer === q.correct_answer;
      if (isCorrect) correctCount++;
      questionScores[q.question_id] = {
        selected: candidateAnswer || null,
        correct: q.correct_answer,
        is_correct: isCorrect,
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const grade =
      score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "F";
    const isPassed = score >= 40;

    // Compute started_at from time_taken_seconds
    const startedAt = time_taken_seconds
      ? new Date(Date.now() - time_taken_seconds * 1000).toISOString()
      : null;

    // Count survey responses for this candidate
    const surveyCount = await db.query(
      "SELECT COUNT(*) AS cnt FROM survey_responses WHERE screening_id = $1",
      [screening_id]
    );
    const surveyResponsesCount = parseInt(surveyCount.rows[0]?.cnt || "0", 10);

    // Store results in assessment_results_v2
    await db.query(
      `INSERT INTO assessment_results_v2
         (screening_id, answers, total_questions, correct_answers, score_percentage,
          is_passed, grade, time_spent, started_at, completed_at, survey_responses_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
       ON CONFLICT (screening_id) DO UPDATE SET
         answers = $2, total_questions = $3, correct_answers = $4, score_percentage = $5,
         is_passed = $6, grade = $7, time_spent = $8, started_at = COALESCE(assessment_results_v2.started_at, $9),
         completed_at = CURRENT_TIMESTAMP, survey_responses_count = $10`,
      [
        screening_id,
        JSON.stringify(questionScores),
        totalQuestions,
        correctCount,
        score,
        isPassed,
        grade,
        time_taken_seconds || null,
        startedAt,
        surveyResponsesCount,
      ]
    );

    // Update candidate status
    await db.query(
      "UPDATE candidates_v2 SET status = 'completed' WHERE screening_id = $1",
      [screening_id]
    );

    res.status(200).json({
      success: true,
      data: {
        screening_id,
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        is_passed: isPassed,
        grade,
      },
    });
  } catch (error) {
    console.error("Error submitting assessment results:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to submit assessment results",
    });
  }
};
