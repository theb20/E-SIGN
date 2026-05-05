import pool from '../config/database.js'
import { v4 as uuid } from 'uuid'

export default class Document {
  static async create({ title, fileName, filePath, fileType, senderName = '', senderEmail = '', message = null }) {
    const id = uuid()
    await pool.execute(
      `INSERT INTO documents (id, title, file_name, file_path, file_type, status, sender_name, sender_email, message)
       VALUES (?,?,?,?,?,'draft',?,?,?)`,
      [id, title, fileName, filePath, fileType, senderName, senderEmail, message]
    )
    return { id }
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id])
    return rows[0] ?? null
  }

  static async updateSender(id, { senderName, senderEmail, message }) {
    await pool.execute(
      'UPDATE documents SET sender_name = ?, sender_email = ?, message = ? WHERE id = ?',
      [senderName ?? '', senderEmail ?? '', message ?? null, id]
    )
  }

  static async setStatus(id, status) {
    const completedAt = status === 'completed' ? new Date() : null
    await pool.execute(
      'UPDATE documents SET status = ?, completed_at = ? WHERE id = ?',
      [status, completedAt, id]
    )
  }

  static async setHash(id, hash) {
    await pool.execute('UPDATE documents SET file_hash = ? WHERE id = ?', [hash, id])
  }

  static async delete(id) {
    await pool.execute('DELETE FROM documents WHERE id = ?', [id])
  }

  static async listAll() {
    const [rows] = await pool.execute('SELECT id, file_path FROM documents')
    return rows
  }
}
