import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import Document   from '../models/Document.js'
import Field      from '../models/Field.js'
import Recipient from '../models/Recipient.js'
import AuditLog  from '../models/AuditLog.js'
import { sendSigningEmail } from '../services/emailService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/* POST /api/documents */
export async function createDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' })

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image'
    const title    = path.parse(req.file.originalname).name

    const { id } = await Document.create({
      title, fileName: req.file.originalname,
      filePath: req.file.filename, fileType,
    })

    // Compute SHA-256 hash for tamper detection
    const filePath = path.join(__dirname, '../../uploads', req.file.filename)
    const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
    await Document.setHash(id, hash)

    await AuditLog.log(id, 'created', { ip: req.ip, userAgent: req.headers['user-agent'] })

    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* PUT /api/documents/:id/fields */
export async function saveFields(req, res) {
  try {
    const { id } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const fields = req.body.fields ?? []
    await Field.deleteByDocument(id)
    const created = await Field.bulkCreate(id, fields)

    res.json({ fields: created })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/documents/:id/send
   body: { senderName, senderEmail, message, recipients: [{name, email}] } */
export async function sendDocument(req, res) {
  try {
    const { id } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const { senderName = '', senderEmail = '', message = '', recipients = [], bulkSend = false } = req.body
    if (!recipients.length) return res.status(400).json({ error: 'Au moins un destinataire requis' })

    const invalidEmails = recipients.filter(r => !r.email?.includes('@'))
    if (invalidEmails.length) return res.status(400).json({ error: 'Email(s) invalide(s)' })

    await Document.updateSender(id, { senderName, senderEmail, message })
    await Document.setStatus(id, 'pending')
    await AuditLog.log(id, 'sent', {
      metadata: { recipientCount: recipients.length, senderName, bulkSend },
      ip: req.ip,
    })

    const recipientsWithIndex = recipients.map((r, i) => ({ ...r, signerIndex: bulkSend ? 0 : i }))
    const created  = await Recipient.bulkCreate(id, recipientsWithIndex)

    if (bulkSend) {
      await Field.duplicateForRecipients(id, created)
    } else {
      await Field.assignToRecipients(id, created.map((r, i) => ({ id: r.id, signerIndex: i })))
    }

    const baseUrl  = process.env.FRONTEND_URL || 'http://localhost:5173'
    const result   = created.map(r => ({
      id:         r.id,
      name:       r.name,
      email:      r.email,
      signingUrl: `${baseUrl}/sign/${r.signing_token}`,
    }))

    res.json({ ok: true, recipients: result })

    // Send emails asynchronously after response
    for (const r of created) {
      const signingUrl = `${baseUrl}/sign/${r.signing_token}`
      sendSigningEmail({
        recipientName: r.name, recipientEmail: r.email,
        senderName, documentTitle: doc.title, message, signingUrl,
      })
        .then(() => Recipient.setEmailSent(r.id))
        .catch(err => console.error(`Email non envoyé à ${r.email}:`, err.message))
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* GET /api/documents/:id/file */
export async function serveFile(req, res) {
  try {
    const { id } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const filePath = path.join(__dirname, '../../uploads', doc.file_path)
    res.sendFile(filePath)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
