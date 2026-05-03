import pool from '../config/database.js'
import { v4 as uuid } from 'uuid'

export default class AuditLog {
  static async log(documentId, event, { recipientId = null, metadata = null, ip = null, userAgent = null } = {}) {
    await pool.execute(
      'INSERT INTO audit_logs (id, document_id, recipient_id, event, metadata, ip, user_agent) VALUES (?,?,?,?,?,?,?)',
      [uuid(), documentId, recipientId, event, metadata ? JSON.stringify(metadata) : null, ip, userAgent ? userAgent.substring(0, 512) : null]
    )
  }

  static async findByDocument(documentId) {
    const [rows] = await pool.execute(
      `SELECT a.*, r.name AS recipient_name, r.email AS recipient_email
       FROM audit_logs a
       LEFT JOIN recipients r ON r.id = a.recipient_id
       WHERE a.document_id = ?
       ORDER BY a.created_at ASC`,
      [documentId]
    )
    return rows.map(r => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata ?? null),
    }))
  }
}
