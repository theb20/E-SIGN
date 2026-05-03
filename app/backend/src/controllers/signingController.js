import Document         from '../models/Document.js'
import Field            from '../models/Field.js'
import Signature        from '../models/Signature.js'
import Recipient        from '../models/Recipient.js'
import AuditLog         from '../models/AuditLog.js'
import { buildSignedPdf } from '../services/pdfExporter.js'
import { sendSignedPdfEmail } from '../services/emailService.js'

/* GET /api/sign/:token */
export async function getSigningSession(req, res) {
  try {
    const recipient = await Recipient.findByToken(req.params.token)
    if (!recipient) return res.status(404).json({ error: 'Lien invalide ou expiré' })
    if (recipient.status === 'completed') return res.status(410).json({ error: 'Vous avez déjà signé ce document', completed: true })

    const fields     = await Field.findByRecipient(recipient.id)
    const signatures = await Signature.findByRecipient(recipient.id)

    const sigMap = {}
    for (const s of signatures) sigMap[s.field_id] = s.data

    AuditLog.log(recipient.doc_id, 'viewed', {
      recipientId: recipient.id, ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(() => {})

    res.json({
      document: {
        id:            recipient.doc_id,
        title:         recipient.title,
        fileName:      recipient.file_name,
        fileType:      recipient.file_type,
        recipientName: recipient.name,
        senderName:    recipient.sender_name,
        status:        recipient.doc_status,
      },
      fileUrl:    `/api/documents/${recipient.doc_id}/file`,
      fields,
      signatures: sigMap,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/sign/:token/signature */
export async function submitSignature(req, res) {
  try {
    const recipient = await Recipient.findByToken(req.params.token)
    if (!recipient) return res.status(404).json({ error: 'Lien invalide' })
    if (recipient.status === 'completed') return res.status(410).json({ error: 'Vous avez déjà signé' })

    const { fieldId, type, data } = req.body
    if (!fieldId || !type || !data) return res.status(400).json({ error: 'Données manquantes' })

    await Signature.upsert(recipient.doc_id, recipient.id, fieldId, type, data)
    AuditLog.log(recipient.doc_id, 'field_signed', {
      recipientId: recipient.id,
      metadata: { fieldId, type },
      ip: req.ip,
    }).catch(() => {})

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/sign/:token/complete */
export async function completeDocument(req, res) {
  try {
    const recipient = await Recipient.findByToken(req.params.token)
    if (!recipient) return res.status(404).json({ error: 'Lien invalide' })

    const fields     = await Field.findByRecipient(recipient.id)
    const signatures = await Signature.findByRecipient(recipient.id)
    const signedIds  = new Set(signatures.map(s => s.field_id))
    const missing    = fields.filter(f => f.required && !signedIds.has(f.id))

    if (missing.length) {
      return res.status(400).json({
        error: `${missing.length} champ(s) requis non signés`,
        missing: missing.map(f => f.id),
      })
    }

    await Recipient.setCompleted(recipient.id)
    await AuditLog.log(recipient.doc_id, 'completed', {
      recipientId: recipient.id, ip: req.ip,
    })

    const allRecipients = await Recipient.findByDocument(recipient.doc_id)
    const allDone = allRecipients.every(r => r.status === 'completed' || r.id === recipient.id)
    if (allDone) {
      await Document.setStatus(recipient.doc_id, 'completed')
      await AuditLog.log(recipient.doc_id, 'document_completed', { ip: req.ip })
    }

    res.json({ ok: true, completedAt: new Date().toISOString() })

    // Send signed PDF to recipient asynchronously
    ;(async () => {
      try {
        const doc    = await Document.findById(recipient.doc_id)
        const fields = await Field.findByRecipient(recipient.id)
        const sigs   = await Signature.findByRecipient(recipient.id)
        const sigMap = {}
        for (const s of sigs) sigMap[s.field_id] = s.data

        const pdfBuffer = await buildSignedPdf(doc, fields, [{ ...recipient, signatures: sigMap }])
        const filename  = `${doc.title}_signé.pdf`.replace(/[^a-zA-Z0-9À-ÿ_\-. ]/g, '_')

        await sendSignedPdfEmail({
          recipientName:  recipient.name,
          recipientEmail: recipient.email,
          senderName:     doc.sender_name,
          documentTitle:  doc.title,
          pdfBuffer,
          filename,
        })
      } catch (err) {
        console.error('Envoi PDF signé échoué:', err.message)
      }
    })()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/sign/:token/refuse */
export async function refuseDocument(req, res) {
  try {
    const recipient = await Recipient.findByToken(req.params.token)
    if (!recipient) return res.status(404).json({ error: 'Lien invalide' })
    if (recipient.status !== 'pending') return res.status(410).json({ error: 'Ce document a déjà été traité' })

    const { reason = '' } = req.body
    await Recipient.setRefused(recipient.id, reason)
    await AuditLog.log(recipient.doc_id, 'refused', {
      recipientId: recipient.id,
      metadata: { reason },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    const allRecipients = await Recipient.findByDocument(recipient.doc_id)
    const anyRefused = allRecipients.some(r => r.status === 'refused' || r.id === recipient.id)
    if (anyRefused) await Document.setStatus(recipient.doc_id, 'cancelled')

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* GET /api/sign/:token/export
   Génère le PDF signé pour le destinataire après signature */
export async function exportSignedByToken(req, res) {
  try {
    const recipient = await Recipient.findByToken(req.params.token)
    if (!recipient) return res.status(404).json({ error: 'Lien invalide' })

    const doc        = await Document.findById(recipient.doc_id)
    const fields     = await Field.findByDocument(recipient.doc_id)
    const allRecips  = await Recipient.findByDocument(recipient.doc_id)

    const recipientsWithSigs = await Promise.all(
      allRecips.map(async (r) => {
        const sigs = await Signature.findByRecipient(r.id)
        const sigMap = {}
        for (const s of sigs) sigMap[s.field_id] = s.data
        return { ...r, signatures: sigMap }
      })
    )

    const pdfBuffer = await buildSignedPdf(doc, fields, recipientsWithSigs)
    const filename  = `${doc.title}_signé.pdf`.replace(/[^a-zA-Z0-9À-ÿ_\-. ]/g, '_')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur génération PDF' })
  }
}
