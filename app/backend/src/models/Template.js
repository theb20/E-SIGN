import pool from '../config/database.js'
import { v4 as uuid } from 'uuid'

export default class Template {
  static async create({ name, description, fields, userId = null }) {
    const id = uuid()
    await pool.execute(
      'INSERT INTO templates (id, user_id, name, description, fields) VALUES (?,?,?,?,?)',
      [id, userId, name, description ?? null, JSON.stringify(fields)]
    )
    return { id }
  }

  static async findAll(userId = null) {
    const [rows] = userId
      ? await pool.execute('SELECT * FROM templates WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC', [userId])
      : await pool.execute('SELECT * FROM templates ORDER BY created_at DESC')
    return rows.map(r => ({
      ...r,
      fields: typeof r.fields === 'string' ? JSON.parse(r.fields) : (r.fields ?? []),
    }))
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [id])
    const r = rows[0]
    if (!r) return null
    return { ...r, fields: typeof r.fields === 'string' ? JSON.parse(r.fields) : (r.fields ?? []) }
  }

  static async delete(id) {
    await pool.execute('DELETE FROM templates WHERE id = ?', [id])
  }
}
