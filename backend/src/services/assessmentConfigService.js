const db = require("../config/db");

const ALLOWED_ANSWER_TYPES = new Set(["yes_no", "mcq", "text"]);

function normalizePreScreeningQuestions(data = {}) {
  const incoming = Array.isArray(data.pre_screening_questions)
    ? data.pre_screening_questions
    : Array.isArray(data.questions)
      ? data.questions
      : [];

  return incoming
    .map((q, index) => {
      const questionText = String(q.question_text || q.text || "").trim();
      if (!questionText) return null;

      const answerType = ALLOWED_ANSWER_TYPES.has(q.answer_type)
        ? q.answer_type
        : "text";

      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options = rawOptions
        .map((option) => String(option).trim())
        .filter(Boolean);

      return {
        question_text: questionText,
        answer_type: answerType,
        options: answerType === "mcq" ? options : [],
        is_mandatory: Boolean(q.is_mandatory),
        expected_answer:
          q.expected_answer === undefined || q.expected_answer === null
            ? null
            : String(q.expected_answer).trim() || null,
        sort_order:
          Number.isInteger(q.sort_order) && q.sort_order >= 0
            ? q.sort_order
            : index,
      };
    })
    .filter(Boolean);
}

async function replacePreScreeningQuestionsInTx(client, assessmentId, questions) {
  await client.query(
    `DELETE FROM hr_pre_screening_questions WHERE assessment_id = $1`,
    [assessmentId]
  );

  for (const question of questions) {
    await client.query(
      `INSERT INTO hr_pre_screening_questions
       (assessment_id, question_text, answer_type, options, is_mandatory, expected_answer, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        assessmentId,
        question.question_text,
        question.answer_type,
        JSON.stringify(question.options || []),
        question.is_mandatory,
        question.expected_answer,
        question.sort_order,
      ]
    );
  }
}

exports.createAssessment = async (data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const preScreeningQuestions = normalizePreScreeningQuestions(data);
    const preScreeningTexts = preScreeningQuestions.map((q) => q.question_text);

    // 1. Create or update template metadata
    let templateId = null;
    let finalTemplateKey = data.template_key;
    if (data.template_key) {
      const existing = await client.query(
        `SELECT id FROM job_templates WHERE template_key = $1`,
        [data.template_key]
      );
      if (existing.rows.length > 0) {
        templateId = existing.rows[0].id;
        await client.query(
          `UPDATE job_templates
           SET job_title = COALESCE($1, job_title),
               required_skills = COALESCE($2, required_skills),
               time_limit_minutes = COALESCE($3, time_limit_minutes),
               pre_screening_questions = COALESCE($4, pre_screening_questions),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            data.role_title,
            data.skills ? data.skills.join(", ") : null,
            data.time_limits?.mcq_time_limit || 30,
            preScreeningTexts.length > 0 ? preScreeningTexts : null,
            templateId,
          ]
        );
      } else {
        const res = await client.query(
          `INSERT INTO job_templates (template_key, job_title, required_skills, time_limit_minutes, pre_screening_questions)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [
            data.template_key,
            data.role_title,
            data.skills ? data.skills.join(", ") : null,
            data.time_limits?.mcq_time_limit || 30,
            preScreeningTexts.length > 0 ? preScreeningTexts : null,
          ]
        );
        templateId = res.rows[0].id;
      }
    } else {
      const byTitle = await client.query(
        `SELECT id, template_key FROM job_templates WHERE job_title = $1 LIMIT 1`,
        [data.role_title]
      );
      if (byTitle.rows.length > 0) {
        templateId = byTitle.rows[0].id;
        finalTemplateKey = byTitle.rows[0].template_key;
        await client.query(
          `UPDATE job_templates
           SET required_skills = COALESCE($1, required_skills),
               time_limit_minutes = COALESCE($2, time_limit_minutes),
               pre_screening_questions = COALESCE($3, pre_screening_questions),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            data.skills ? data.skills.join(", ") : null,
            data.time_limits?.mcq_time_limit || 30,
            preScreeningTexts.length > 0 ? preScreeningTexts : null,
            templateId,
          ]
        );
      } else {
        const key = `Template_${Date.now()}`;
        const res = await client.query(
          `INSERT INTO job_templates (template_key, job_title, required_skills, time_limit_minutes, pre_screening_questions)
           VALUES ($1,$2,$3,$4,$5) RETURNING id, template_key`,
          [
            key,
            data.role_title,
            data.skills ? data.skills.join(", ") : null,
            data.time_limits?.mcq_time_limit || 30,
            preScreeningTexts.length > 0 ? preScreeningTexts : null,
          ]
        );
        templateId = res.rows[0].id;
        finalTemplateKey = res.rows[0].template_key;
      }
    }

    // 2. Create job posting (JID auto-generated)
    const postingRes = await client.query(
      `INSERT INTO job_postings (template_id, job_title, status, created_by, headcount, closes_at, department, hiring_manager, interviewer)
       VALUES ($1, $2, 'open', $3, $4, $5, $6, $7, $8)
       RETURNING jid`,
      [
        templateId,
        data.role_title,
        "HR Team",
        data.headcount || 1,
        data.closes_at || null,
        data.department || null,
        data.hiring_manager || null,
        data.interviewer || null,
      ]
    );
    const jid = postingRes.rows[0].jid;

    // 3. Create assessment
    const assessmentRes = await client.query(
      `INSERT INTO hr_assessments (
        jid, template_id, role_title, experience_level, skills,
        job_description, ai_generated_jd,
        mcq_time_limit, video_time_limit, coding_time_limit,
        include_coding, include_aptitude, include_ai_interview, include_manual_interview, generate_ai_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        jid,
        templateId,
        data.role_title,
        data.experience_level,
        data.skills || [],
        data.job_description || null,
        data.ai_generated_jd || false,
        data.time_limits?.mcq_time_limit || 30,
        data.time_limits?.video_time_limit || 15,
        data.time_limits?.coding_time_limit || 45,
        data.options?.include_coding || false,
        data.options?.include_aptitude || false,
        data.options?.include_ai_interview ?? true,
        data.options?.include_manual_interview || false,
        data.options?.generate_ai_questions ?? true,
      ]
    );
    const assessmentId = assessmentRes.rows[0].id;

    // 4. Persist pre-screening questions in dedicated table
    if (preScreeningQuestions.length > 0) {
      await replacePreScreeningQuestionsInTx(
        client,
        assessmentId,
        preScreeningQuestions
      );
    }

    // Legacy assessment_questions insertion kept optional and separate from pre-screening.
    if (Array.isArray(data.assessment_questions) && data.assessment_questions.length > 0) {
      for (let i = 0; i < data.assessment_questions.length; i++) {
        const q = data.assessment_questions[i];
        if (!q.question_text) continue;
        await client.query(
          `INSERT INTO hr_assessment_questions (assessment_id, question_text, is_default, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [assessmentId, q.question_text, q.is_default || false, i]
        );
      }
    }

    await client.query("COMMIT");

    // Trigger n8n: generate assessment and send pre-screen survey workflow
    const n8nWebhookUrl =
      process.env.N8N_ASSESSMENT_WEBHOOK_URL ||
      "http://n8n:5678/webhook/generate-assessment";
    fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_assessment",
        assessment_id: assessmentId,
        jid,
        role_title: data.role_title,
        skills: data.skills || [],
        experience_level: data.experience_level || "",
        pre_screening_questions: preScreeningQuestions,
      }),
    }).catch((err) =>
      console.warn("[n8n assessment trigger] Failed silently:", err.message)
    );

    return {
      assessment_id: assessmentId,
      jid,
      template_key: finalTemplateKey,
      pre_screening_questions_count: preScreeningQuestions.length,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getAllAssessments = async (filters = {}) => {
  const params = [];
  const conditions = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await db.query(
    `SELECT * FROM hr_assessments ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

exports.getAssessmentById = async (id) => {
  const assessment = await db.query(`SELECT * FROM hr_assessments WHERE id = $1`, [id]);
  if (assessment.rows.length === 0) return null;

  const questions = await db.query(
    `SELECT * FROM hr_assessment_questions WHERE assessment_id = $1 ORDER BY sort_order`,
    [id]
  );

  const preScreeningQuestions = await db.query(
    `SELECT id, assessment_id, question_text, answer_type, options, is_mandatory, expected_answer, sort_order
     FROM hr_pre_screening_questions
     WHERE assessment_id = $1
     ORDER BY sort_order, id`,
    [id]
  );

  const result = assessment.rows[0];
  result.questions = questions.rows;
  result.pre_screening_questions = preScreeningQuestions.rows.map((row) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
  }));
  return result;
};

exports.getAssessmentPreScreeningQuestions = async (assessmentId) => {
  const result = await db.query(
    `SELECT id, assessment_id, question_text, answer_type, options, is_mandatory, expected_answer, sort_order
     FROM hr_pre_screening_questions
     WHERE assessment_id = $1
     ORDER BY sort_order, id`,
    [assessmentId]
  );
  return result.rows.map((row) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
  }));
};

exports.updateAssessmentPreScreeningQuestions = async (assessmentId, questions) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id FROM hr_assessments WHERE id = $1`,
      [assessmentId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const normalized = normalizePreScreeningQuestions({
      pre_screening_questions: questions,
    });
    await replacePreScreeningQuestionsInTx(client, assessmentId, normalized);

    await client.query("COMMIT");
    return normalized;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateAssessment = async (id, data) => {
  const result = await db.query(
    `UPDATE hr_assessments
     SET role_title = COALESCE($1, role_title),
         experience_level = COALESCE($2, experience_level),
         skills = COALESCE($3, skills),
         mcq_time_limit = COALESCE($4, mcq_time_limit),
         video_time_limit = COALESCE($5, video_time_limit),
         coding_time_limit = COALESCE($6, coding_time_limit),
         include_coding = COALESCE($7, include_coding),
         include_aptitude = COALESCE($8, include_aptitude),
         include_ai_interview = COALESCE($9, include_ai_interview),
         include_manual_interview = COALESCE($10, include_manual_interview),
         generate_ai_questions = COALESCE($11, generate_ai_questions),
         job_description = COALESCE($12, job_description),
         ai_generated_jd = COALESCE($13, ai_generated_jd),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $14
     RETURNING *`,
    [
      data.role_title || null,
      data.experience_level || null,
      data.skills || null,
      data.time_limits?.mcq_time_limit || null,
      data.time_limits?.video_time_limit || null,
      data.time_limits?.coding_time_limit || null,
      data.options?.include_coding ?? null,
      data.options?.include_aptitude ?? null,
      data.options?.include_ai_interview ?? null,
      data.options?.include_manual_interview ?? null,
      data.options?.generate_ai_questions ?? null,
      data.job_description || null,
      data.job_description ? true : null,
      id,
    ]
  );
  return result.rows[0] || null;
};

exports.deleteAssessment = async (id) => {
  const result = await db.query(
    `UPDATE hr_assessments SET status = 'archived' WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
};
