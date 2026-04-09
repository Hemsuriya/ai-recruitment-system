const db = require("../config/db");

const ALLOWED_ANSWER_TYPES = new Set(["yes_no", "mcq", "text"]);
const DEFAULT_OPTIONAL_SKILL_WEIGHT = 0.5;

function normalizeSkillConfig(data = {}) {
  const rawSkillConfig = Array.isArray(data.skill_config) ? data.skill_config : null;
  const fallbackSkills = Array.isArray(data.skills)
    ? data.skills.map((s) => String(s || "").trim()).filter(Boolean)
    : [];
  const fallbackOptionalSkills = Array.isArray(data.optional_skills)
    ? data.optional_skills.map((s) => String(s || "").trim()).filter(Boolean)
    : [];
  const fallbackWeights =
    data.skill_weights && typeof data.skill_weights === "object"
      ? data.skill_weights
      : null;

  if (!rawSkillConfig) {
    const mandatory = [...new Set(fallbackSkills)];
    const optional = [...new Set(fallbackOptionalSkills)];
    const weights = {};
    mandatory.forEach((skill) => {
      const fromPayload = fallbackWeights ? Number(fallbackWeights[skill]) : NaN;
      weights[skill] = Number.isFinite(fromPayload) && fromPayload > 0 ? fromPayload : 1;
    });
    return {
      mandatory_skills: mandatory,
      optional_skills: optional,
      skill_weights: weights,
      optional_skill_weight: DEFAULT_OPTIONAL_SKILL_WEIGHT,
    };
  }

  const mandatory = [];
  const optional = [];
  const mandatorySeen = new Set();
  const optionalSeen = new Set();
  const skillWeights = {};
  for (const skillRow of rawSkillConfig) {
    const skillName = String(skillRow?.name || "").trim();
    if (!skillName) continue;

    const isMandatory = skillRow?.is_mandatory !== false;
    if (isMandatory) {
      if (!mandatorySeen.has(skillName)) {
        mandatory.push(skillName);
        mandatorySeen.add(skillName);
      }
      const weightRaw = Number(skillRow?.weight);
      skillWeights[skillName] =
        Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 1;
    } else {
      if (!optionalSeen.has(skillName)) {
        optional.push(skillName);
        optionalSeen.add(skillName);
      }
    }
  }

  return {
    mandatory_skills: mandatory,
    optional_skills: optional,
    skill_weights: skillWeights,
    optional_skill_weight: DEFAULT_OPTIONAL_SKILL_WEIGHT,
  };
}

function buildAssessmentSkillRows(skillConfig) {
  const rows = [];
  let sortOrder = 0;

  for (const skillName of skillConfig.mandatory_skills || []) {
    rows.push({
      skill_name: skillName,
      is_mandatory: true,
      weight: Number(skillConfig.skill_weights?.[skillName] || 1),
      sort_order: sortOrder++,
    });
  }

  for (const skillName of skillConfig.optional_skills || []) {
    rows.push({
      skill_name: skillName,
      is_mandatory: false,
      weight: DEFAULT_OPTIONAL_SKILL_WEIGHT,
      sort_order: sortOrder++,
    });
  }

  return rows;
}

async function replaceAssessmentSkillMappingsInTx(client, assessmentId, skillConfig) {
  await client.query(`DELETE FROM hr_assessment_skill_mappings WHERE assessment_id = $1`, [
    assessmentId,
  ]);

  const rows = buildAssessmentSkillRows(skillConfig);
  for (const row of rows) {
    await client.query(
      `INSERT INTO hr_assessment_skill_mappings
       (assessment_id, skill_name, is_mandatory, weight, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [assessmentId, row.skill_name, row.is_mandatory, row.weight, row.sort_order]
    );
  }
}

async function getAssessmentSkillMappings(assessmentId) {
  const mappings = await db.query(
    `SELECT assessment_id, skill_name, is_mandatory, weight, sort_order
     FROM hr_assessment_skill_mappings
     WHERE assessment_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [assessmentId]
  );
  return mappings.rows;
}

function normalizeOptionalScoreMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const normalized = {};
  for (const [key, value] of Object.entries(raw)) {
    const answerKey = String(key || "").trim();
    const numericValue = Number(value);
    if (!answerKey || !Number.isFinite(numericValue)) continue;
    normalized[answerKey] = numericValue;
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

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

      const isMandatory = Boolean(q.is_mandatory);
      const optionalWeightRaw = Number(q.optional_weight);
      const optionalWeight = Number.isFinite(optionalWeightRaw) && optionalWeightRaw >= 0
        ? optionalWeightRaw
        : null;
      const optionalScoreMap = normalizeOptionalScoreMap(q.optional_score_map);

      return {
        question_text: questionText,
        answer_type: answerType,
        options: answerType === "mcq" ? options : [],
        is_mandatory: isMandatory,
        expected_answer:
          q.expected_answer === undefined || q.expected_answer === null
            ? null
            : String(q.expected_answer).trim() || null,
        optional_weight: isMandatory ? null : optionalWeight,
        optional_score_map: isMandatory ? null : optionalScoreMap,
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
       (assessment_id, question_text, answer_type, options, is_mandatory, expected_answer, optional_weight, optional_score_map, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        assessmentId,
        question.question_text,
        question.answer_type,
        JSON.stringify(question.options || []),
        question.is_mandatory,
        question.expected_answer,
        question.optional_weight,
        question.optional_score_map ? JSON.stringify(question.optional_score_map) : null,
        question.sort_order,
      ]
    );
  }
}

exports.createAssessment = async (data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const skillConfig = normalizeSkillConfig(data);
    const mandatorySkillsCsv = skillConfig.mandatory_skills.join(", ");
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
            mandatorySkillsCsv || null,
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
            mandatorySkillsCsv || null,
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
            mandatorySkillsCsv || null,
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
            mandatorySkillsCsv || null,
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
        jid, template_id, role_title, experience_level, skills, mandatory_skills, optional_skills, skill_weights, optional_skill_weight,
        job_description, ai_generated_jd,
        mcq_time_limit, video_time_limit, coding_time_limit,
        include_coding, include_aptitude, include_ai_interview, include_manual_interview, generate_ai_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id`,
      [
        jid,
        templateId,
        data.role_title,
        data.experience_level,
        skillConfig.mandatory_skills,
        skillConfig.mandatory_skills,
        skillConfig.optional_skills,
        JSON.stringify(skillConfig.skill_weights),
        skillConfig.optional_skill_weight,
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
    await replaceAssessmentSkillMappingsInTx(client, assessmentId, skillConfig);

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
        skills: skillConfig.mandatory_skills,
        optional_skills: skillConfig.optional_skills,
        skill_weights: skillConfig.skill_weights,
        optional_skill_weight: skillConfig.optional_skill_weight,
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
      skill_config: skillConfig,
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
    `SELECT id, assessment_id, question_text, answer_type, options, is_mandatory, expected_answer, optional_weight, optional_score_map, sort_order
     FROM hr_pre_screening_questions
     WHERE assessment_id = $1
     ORDER BY sort_order, id`,
    [id]
  );
  const skillMappings = await getAssessmentSkillMappings(id);

  const result = assessment.rows[0];
  if (skillMappings.length > 0) {
    const mandatorySkills = [];
    const optionalSkills = [];
    const skillWeights = {};

    for (const row of skillMappings) {
      if (row.is_mandatory) {
        mandatorySkills.push(row.skill_name);
        skillWeights[row.skill_name] = Number(row.weight || 1);
      } else {
        optionalSkills.push(row.skill_name);
      }
    }

    result.skills = mandatorySkills;
    result.mandatory_skills = mandatorySkills;
    result.optional_skills = optionalSkills;
    result.skill_weights = skillWeights;
    result.optional_skill_weight = DEFAULT_OPTIONAL_SKILL_WEIGHT;
    result.skill_config = skillMappings.map((row) => ({
      name: row.skill_name,
      is_mandatory: Boolean(row.is_mandatory),
      weight: Number(row.weight || 1),
      sort_order: Number(row.sort_order || 0),
    }));
  }
  result.questions = questions.rows;
  result.pre_screening_questions = preScreeningQuestions.rows.map((row) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
    optional_score_map:
      row.optional_score_map && typeof row.optional_score_map === "object"
        ? row.optional_score_map
        : null,
  }));
  return result;
};

exports.getAssessmentPreScreeningQuestions = async (assessmentId) => {
  const result = await db.query(
    `SELECT id, assessment_id, question_text, answer_type, options, is_mandatory, expected_answer, optional_weight, optional_score_map, sort_order
     FROM hr_pre_screening_questions
     WHERE assessment_id = $1
     ORDER BY sort_order, id`,
    [assessmentId]
  );
  return result.rows.map((row) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
    optional_score_map:
      row.optional_score_map && typeof row.optional_score_map === "object"
        ? row.optional_score_map
        : null,
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
  const hasSkillPayload =
    Array.isArray(data.skill_config) ||
    Array.isArray(data.skills) ||
    Array.isArray(data.optional_skills) ||
    (data.skill_weights && typeof data.skill_weights === "object");
  const skillConfig = hasSkillPayload ? normalizeSkillConfig(data) : null;
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE hr_assessments
       SET role_title = COALESCE($1, role_title),
           experience_level = COALESCE($2, experience_level),
           skills = COALESCE($3, skills),
           mandatory_skills = COALESCE($4, mandatory_skills),
           optional_skills = COALESCE($5, optional_skills),
           skill_weights = COALESCE($6, skill_weights),
           optional_skill_weight = COALESCE($7, optional_skill_weight),
           mcq_time_limit = COALESCE($8, mcq_time_limit),
           video_time_limit = COALESCE($9, video_time_limit),
           coding_time_limit = COALESCE($10, coding_time_limit),
           include_coding = COALESCE($11, include_coding),
           include_aptitude = COALESCE($12, include_aptitude),
           include_ai_interview = COALESCE($13, include_ai_interview),
           include_manual_interview = COALESCE($14, include_manual_interview),
           generate_ai_questions = COALESCE($15, generate_ai_questions),
           job_description = COALESCE($16, job_description),
           ai_generated_jd = COALESCE($17, ai_generated_jd),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $18
       RETURNING *`,
      [
        data.role_title || null,
        data.experience_level || null,
        skillConfig ? skillConfig.mandatory_skills : null,
        skillConfig ? skillConfig.mandatory_skills : null,
        skillConfig ? skillConfig.optional_skills : null,
        skillConfig ? JSON.stringify(skillConfig.skill_weights || {}) : null,
        skillConfig ? skillConfig.optional_skill_weight : null,
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

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    if (skillConfig) {
      await replaceAssessmentSkillMappingsInTx(client, id, skillConfig);
    }

    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.deleteAssessment = async (id) => {
  const result = await db.query(
    `UPDATE hr_assessments SET status = 'archived' WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
};
