import pool from '../config/database.js'
import { v4 as uuid } from 'uuid'

export default class Field {
  static async bulkCreate(documentId, fields) {
    if (!fields.length) return []
    const created = []
    for (const f of fields) {
      const id = uuid()
      const options = JSON.stringify({
        ...(f.options ? (Array.isArray(f.options) ? { choices: f.options } : f.options) : {}),
        signerIndex: f.signerIndex ?? 0,
      })
      await pool.execute(
        `INSERT INTO fields (id, document_id, type, label, options, x, y, width, height, required, page)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, documentId, f.type, f.label ?? '', options,
         f.x, f.y, f.width, f.height, f.required ? 1 : 0, f.page ?? 1]
      )
      created.push({ ...f, id, documentId })
    }
    return created
  }

  static async assignToRecipients(documentId, recipients) {
    for (const r of recipients) {
      await pool.execute(
        `UPDATE fields
         SET recipient_id = ?
         WHERE document_id = ?
           AND JSON_UNQUOTE(JSON_EXTRACT(options, '$.signerIndex')) = ?`,
        [r.id, documentId, String(r.signerIndex ?? 0)]
      )
    }
  }

  static async findByDocument(documentId) {
    const [rows] = await pool.execute(
      'SELECT * FROM fields WHERE document_id = ? ORDER BY created_at',
      [documentId]
    )
    return rows.map(r => ({
      ...r,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options ?? {}),
    }))
  }

  static async findByRecipient(recipientId) {
    const [rows] = await pool.execute(
      'SELECT * FROM fields WHERE recipient_id = ?',
      [recipientId]
    )
    return rows.map(r => ({
      ...r,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options ?? {}),
    }))
  }

  static async duplicateForRecipients(documentId, recipients) {
    const [rows] = await pool.execute(
      'SELECT * FROM fields WHERE document_id = ? AND recipient_id IS NULL',
      [documentId]
    )
    for (const recipient of recipients) {
      for (const f of rows) {
        const id  = uuid()
        const opt = typeof f.options === 'string' ? f.options : JSON.stringify(f.options ?? {})
        await pool.execute(
          `INSERT INTO fields (id, document_id, recipient_id, type, label, options, x, y, width, height, required, page)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, documentId, recipient.id, f.type, f.label, opt, f.x, f.y, f.width, f.height, f.required, f.page ?? 1]
        )
      }
    }
    await pool.execute('DELETE FROM fields WHERE document_id = ? AND recipient_id IS NULL', [documentId])
  }

  static async deleteByDocument(documentId) {
    await pool.execute('DELETE FROM fields WHERE document_id = ?', [documentId])
  }
}
