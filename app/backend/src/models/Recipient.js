import pool from '../config/database.js'
import { v4 as uuid } from 'uuid'
import crypto from 'crypto'

export default class Recipient {
  static async bulkCreate(documentId, recipients) {
    const created = []
    for (const r of recipients) {
      const id    = uuid()
      const token = crypto.randomBytes(32).toString('hex')
      await pool.execute(
        `INSERT INTO recipients (id, document_id, name, email, signing_token)
         VALUES (?,?,?,?,?)`,
        [id, documentId, r.name ?? '', r.email, token]
      )
      created.push({ id, documentId, name: r.name ?? '', email: r.email, signing_token: token })
    }
    return created
  }

  static async findByToken(token) {
    const [rows] = await pool.execute(
      `SELECT r.*, d.title, d.file_name, d.file_type, d.status AS doc_status,
              d.sender_name, d.sender_email, d.message, d.id AS doc_id
       FROM recipients r
       JOIN documents d ON d.id = r.document_id
       WHERE r.signing_token = ?`,
      [token]
    )
    return rows[0] ?? null
  }

  static async findByDocument(documentId) {
    const [rows] = await pool.execute(
      'SELECT * FROM recipients WHERE document_id = ? ORDER BY created_at',
      [documentId]
    )
    return rows
  }

  static async setCompleted(id) {
    await pool.execute(
      "UPDATE recipients SET status = 'completed', completed_at = NOW() WHERE id = ?",
      [id]
    )
  }

  static async setRefused(id, reason) {
    await pool.execute(
      "UPDATE recipients SET status = 'refused', refuse_reason = ?, refused_at = NOW() WHERE id = ?",
      [reason ?? '', id]
    )
  }

  static async setEmailSent(id) {
    await pool.execute('UPDATE recipients SET email_sent = 1 WHERE id = ?', [id])
  }

  static async setReminderSent(id) {
    await pool.execute('UPDATE recipients SET reminder_sent_at = NOW() WHERE id = ?', [id])
  }
}
