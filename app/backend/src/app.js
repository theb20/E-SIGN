import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { testConnection } from './config/database.js'
import documentRoutes   from './routes/documents.js'
import signingRoutes    from './routes/signing.js'
import dashboardRoutes  from './routes/dashboard.js'
import templateRoutes   from './routes/templates.js'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '../../uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const app  = express()
const PORT = process.env.PORT || 3001

/* ── Middlewares ─────────────────────────────────────────── */
const allowedOrigins = [
  'https://app-esign.web.app',
  'https://app-esign.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean)
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))

/* ── Routes ──────────────────────────────────────────────── */
app.use('/api/documents', documentRoutes)
app.use('/api/sign',      signingRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/templates', templateRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date() }))

/* ── 404 ─────────────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }))

/* ── Error handler ───────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' })
})

/* ── Start ───────────────────────────────────────────────── */
testConnection()
  .then(() => {
    console.log('✓ MySQL connecté')
    app.listen(PORT, () => console.log(`✓ Backend démarré sur http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('✗ MySQL connexion échouée :', err.message)
    process.exit(1)
  })
