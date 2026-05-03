import pool from '../config/database.js'
import { v4 as uuid } from 'uuid'

export default class Signature {
  static async upsert(documentId, recipientId, fieldId, type, data) {
    const id = uuid()
    await pool.execute(
      `INSERT INTO signatures (id, document_id, recipient_id, field_id, type, data)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE type = VALUES(type), data = VALUES(data), signed_at = NOW()`,
      [id, documentId, recipientId, fieldId, type, JSON.stringify(data)]
    )
  }

  static async findByRecipient(recipientId) {
    const [rows] = await pool.execute(
      'SELECT * FROM signatures WHERE recipient_id = ?',
      [recipientId]
    )
    return rows.map(r => ({ ...r, data: typeof r.data === 'string' ? JSON.parse(r.data) : (r.data ?? {}) }))
  }

  static async findByDocument(documentId) {
    const [rows] = await pool.execute(
      'SELECT * FROM signatures WHERE document_id = ?',
      [documentId]
    )
    return rows.map(r => ({ ...r, data: typeof r.data === 'string' ? JSON.parse(r.data) : (r.data ?? {}) }))
  }
}
