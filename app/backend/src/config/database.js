import mysql from 'mysql2/promise'
import 'dotenv/config'

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'esign',
  waitForConnections: true,
  connectionLimit:    5,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000,
  connectTimeout:     30000,
  idleTimeout:        60000,
})

export async function testConnection() {
  const conn = await pool.getConnection()
  await conn.ping()
  conn.release()
}

export default pool
