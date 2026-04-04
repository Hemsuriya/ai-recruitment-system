const db = require("../config/db");

exports.createAssessment = async (data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // 1. Create or update template (same logic as before)
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
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            data.role_title,
            data.skills ? data.skills.join(", ") : null,
            data.time_limits?.mcq_time_limit || 30,
            templateId
          ]
        );
      } else {
        const res = await client.query(
          `INSERT INTO job_templates (template_key, job_title, required_skills, time_limit_minutes)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [data.template_key, data.role_title, data.skills ? data.skills.join(", ") : null, data.time_limits?.mcq_time_limit || 30]
        );
        templateId = res.rows[0].id;
      }
    } else {
      const key = `Template_${Date.now()}`;
      const res = await client.query(
        `INSERT INTO job_templates (template_key, job_title, required_skills, time_limit_minutes)
         VALUES ($1,$2,$3,$4) RETURNING id, template_key`,
        [key, data.role_title, data.skills ? data.skills.join(", ") : null, data.time_limits?.mcq_time_limit || 30]
      );
      templateId = res.rows[0].id;
      finalTemplateKey = res.rows[0].template_key;
    }

    // 2. Create job posting (JID auto-generated)
    const postingRes = await client.query(
      `INSERT INTO job_postings (template_id, job_title, status, created_by, headcount, closes_at, department, hiring_manager, interviewer)
       VALUES ($1, $2, 'open', $3, $4, $5, $6, $7, $8)
       RETURNING jid`,
      [
        templateId, data.role_title, "HR Team",
        data.headcount || 1, data.closes_at || null,
        data.department || null, data.hiring_manager || null, data.interviewer || null
      ]
    );
    const jid = postingRes.rows[0].jid;

    // 3. Create hr_assessment record
    const assessmentRes = await client.query(
      `INSERT INTO hr_assessments (
        jid, template_id, role_title, experience_level, skills,
        job_description, ai_generated_jd,
        mcq_time_limit, video_time_limit, coding_time_limit,
        include_coding, include_aptitude, include_ai_interview, include_manual_interview, generate_ai_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        jid, templateId, data.role_title, data.experience_level, data.skills || [],
        data.job_description || null, data.ai_generated_jd || false,
        data.time_limits?.mcq_time_limit || 30,
        data.time_limits?.video_time_limit || 15,
        data.time_limits?.coding_time_limit || 45,
        data.options?.include_coding || false,
        data.options?.include_aptitude || false,
        data.options?.include_ai_interview ?? true,
        data.options?.include_manual_interview || false,
        data.options?.generate_ai_questions ?? true
      ]
    );
    const assessmentId = assessmentRes.rows[0].id;

    // 4. Insert questions if provided
    if (data.questions && data.questions.length > 0) {
      const selectedQuestions = data.questions.filter(q => q.is_selected !== false);
      for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        await client.query(
          `INSERT INTO hr_assessment_questions (assessment_id, question_text, is_default, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [assessmentId, q.question_text, q.is_default || false, i]
        );
      }
    }

    await client.query("COMMIT");

    // Fire-and-forget: Trigger n8n pipeline for resume screening + MCQ generation
    const n8nWebhookUrl = process.env.N8N_ASSESSMENT_WEBHOOK_URL || 'http://n8n:5678/webhook/generate-assessment';
    fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessment_id: assessmentId,
        jid,
        role_title: data.role_title,
        skills: data.skills || [],
        experience_level: data.experience_level || "",
      }),
    }).catch(err => console.warn("[n8n JD trigger] Failed silently:", err.message));

    return {
      assessment_id: assessmentId,
      jid,
      template_key: finalTemplateKey
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
  
  const result = assessment.rows[0];
  result.questions = questions.rows;
  return result;
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
      data.role_title || null, data.experience_level || null, data.skills || null,
      data.time_limits?.mcq_time_limit || null, data.time_limits?.video_time_limit || null, data.time_limits?.coding_time_limit || null,
      data.options?.include_coding ?? null, data.options?.include_aptitude ?? null, data.options?.include_ai_interview ?? null,
      data.options?.include_manual_interview ?? null, data.options?.generate_ai_questions ?? null,
      data.job_description || null, data.job_description ? true : null,
      id
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
