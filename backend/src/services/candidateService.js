const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.createCandidate = async (data) => {
  const screening_id = uuidv4();

  const query = `
    INSERT INTO candidates_v2
    (screening_id, name, email, phone, location, template_key)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;

  const values = [
    screening_id,
    data.name,
    data.email,
    data.phone,
    data.location,
    data.template_key || null
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};
