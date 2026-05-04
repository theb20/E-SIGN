import pool              from '../config/database.js'
import Field             from '../models/Field.js'
import Recipient         from '../models/Recipient.js'
import Signature         from '../models/Signature.js'
import AuditLog          from '../models/AuditLog.js'
import Document          from '../models/Document.js'
import { buildSignedPdf } from '../services/pdfExporter.js'
import { sendSigningEmail, sendReminderEmail } from '../services/emailService.js'

/* GET /api/dashboard/documents
   Liste tous les documents avec résumé recipients */
export async function listDocuments(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT d.*,
        COUNT(DISTINCT r.id)                                         AS recipient_count,
        SUM(r.status = 'completed')                                  AS signed_count,
        SUM(r.email_sent = 1)                                        AS emailed_count
      FROM documents d
      LEFT JOIN recipients r ON r.document_id = d.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `)
    res.json({ documents: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* GET /api/dashboard/documents/:id
   Détail complet d'un document : infos + recipients + signatures + audit */
export async function getDocument(req, res) {
  try {
    const { id } = req.params

    const [docRows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id])
    const doc = docRows[0]
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const fields     = await Field.findByDocument(id)
    const recipients = await Recipient.findByDocument(id)
    const auditLogs  = await AuditLog.findByDocument(id)

    // Attach signatures per recipient
    const recipientsWithSigs = await Promise.all(
      recipients.map(async (r) => {
        const sigs = await Signature.findByRecipient(r.id)
        const sigMap = {}
        for (const s of sigs) sigMap[s.field_id] = s.data
        return { ...r, signatures: sigMap, signedCount: sigs.length }
      })
    )

    res.json({
      document:   doc,
      fields,
      recipients: recipientsWithSigs,
      auditLogs,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/dashboard/documents/:id/cancel */
export async function cancelDocument(req, res) {
  try {
    const { id } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })
    if (!['draft', 'pending'].includes(doc.status)) {
      return res.status(400).json({ error: 'Impossible d\'annuler un document déjà complété' })
    }
    await Document.setStatus(id, 'cancelled')
    await AuditLog.log(id, 'cancelled', { ip: req.ip, userAgent: req.headers['user-agent'] })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/dashboard/documents/:id/remind/:recipientId */
export async function sendReminder(req, res) {
  try {
    const { id, recipientId } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const [recips] = await pool.execute('SELECT * FROM recipients WHERE id = ? AND document_id = ?', [recipientId, id])
    const r = recips[0]
    if (!r) return res.status(404).json({ error: 'Destinataire introuvable' })
    if (r.status !== 'pending') return res.status(400).json({ error: 'Le destinataire a déjà signé ou refusé' })

    const baseUrl  = process.env.FRONTEND_URL 
    const signingUrl = `${baseUrl}/sign/${r.signing_token}`

    sendReminderEmail({
      recipientName: r.name, recipientEmail: r.email,
      senderName: doc.sender_name, documentTitle: doc.title, signingUrl,
    }).catch(err => console.error('Reminder email failed:', err.message))

    await Recipient.setReminderSent(r.id)
    await AuditLog.log(id, 'reminder_sent', {
      recipientId: r.id,
      metadata: { recipientEmail: r.email },
      ip: req.ip,
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* GET /api/dashboard/documents/:id/export/:recipientId
   Génère le PDF signé pour un seul destinataire */
export async function exportSignedByRecipient(req, res) {
  try {
    const { id, recipientId } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const allRecipients = await Recipient.findByDocument(id)
    const recipient = allRecipients.find(r => r.id === recipientId)
    if (!recipient) return res.status(404).json({ error: 'Destinataire introuvable' })

    const fields = await Field.findByRecipient(recipientId)
    const sigs   = await Signature.findByRecipient(recipientId)
    const sigMap = {}
    for (const s of sigs) sigMap[s.field_id] = s.data

    const pdfBuffer = await buildSignedPdf(doc, fields, [{ ...recipient, signatures: sigMap }])
    const filename  = `${doc.title}_${recipient.name || recipient.email}_signé.pdf`
      .replace(/[^a-zA-Z0-9À-ÿ_\-. ]/g, '_')

    const disposition = req.query.inline === '1' ? 'inline' : `attachment; filename="${filename}"`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', disposition)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur génération PDF' })
  }
}

/* GET /api/dashboard/documents/:id/export
   Génère le PDF signé et le renvoie en téléchargement */
export async function exportSignedDocument(req, res) {
  try {
    const { id } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'Document introuvable' })

    const fields     = await Field.findByDocument(id)
    const recipients = await Recipient.findByDocument(id)

    const recipientsWithSigs = await Promise.all(
      recipients.map(async (r) => {
        const sigs = await Signature.findByRecipient(r.id)
        const sigMap = {}
        for (const s of sigs) sigMap[s.field_id] = s.data
        return { ...r, signatures: sigMap }
      })
    )

    const pdfBuffer = await buildSignedPdf(doc, fields, recipientsWithSigs)
    const filename  = `${doc.title}_signé.pdf`
      .replace(/[^a-zA-Z0-9À-ÿ_\-. ]/g, '_')

    const disposition = req.query.inline === '1' ? 'inline' : `attachment; filename="${filename}"`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', disposition)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur génération PDF' })
  }
}
