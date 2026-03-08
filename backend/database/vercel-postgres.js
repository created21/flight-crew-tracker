// backend/database/vercel-postgres.js
const { sql } = require('@vercel/postgres');

module.exports = {
  async getUserByTelegramId(telegramId) {
    const { rows } = await sql`
      SELECT * FROM users WHERE "telegramId" = ${telegramId}
    `;
    return rows[0];
  },
  
  async getUserByToken(token) {
    const { rows } = await sql`
      SELECT * FROM users WHERE token = ${token}
    `;
    return rows[0];
  },
  
  async createUser({ telegramId, username, token }) {
    const { rows } = await sql`
      INSERT INTO users ("telegramId", username, token)
      VALUES (${telegramId}, ${username}, ${token})
      RETURNING *
    `;
    return rows[0];
  },
  
  async updateUserToken(id, token) {
    const { rows } = await sql`
      UPDATE users SET token = ${token}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },
  
  async saveReport({ userId, flightId, report }) {
    const { rows } = await sql`
      INSERT INTO reports ("userId", "flightId", report)
      VALUES (${userId}, ${flightId}, ${report})
      RETURNING *
    `;
    return rows[0];
  }
};