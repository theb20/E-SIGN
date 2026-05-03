import { Resend } from 'resend'
import nodemailer from 'nodemailer'

/* ── Transport ──────────────────────────────────────────────── */

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

function getSmtp() {
  if (!process.env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

async function send({ to, subject, html, attachments = [] }) {
  const resend = getResend()
  if (resend) {
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const payload = { from, to, subject, html }
    if (attachments.length) payload.attachments = attachments
    const { error } = await resend.emails.send(payload)
    if (error) throw new Error(`Resend: ${error.message}`)
    return
  }

  const smtp = getSmtp()
  if (smtp) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER
    const mail  = { from: `"E·SIGN" <${from}>`, to, subject, html }
    if (attachments.length) {
      mail.attachments = attachments.map(a => ({
        filename:    a.filename,
        content:     a.content,
        contentType: 'application/pdf',
      }))
    }
    await smtp.sendMail(mail)
    return
  }

  console.log(`[Email simulé] À : ${to} | Objet : ${subject}`)
}

/* ── Emails ─────────────────────────────────────────────────── */

export async function sendSigningEmail({ recipientName, recipientEmail, senderName, documentTitle, message, signingUrl }) {
  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,'
  await send({
    to:      recipientEmail,
    subject: `${senderName || 'Quelqu\'un'} vous invite à signer : ${documentTitle}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:2px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.1);">
        <tr><td style="height:4px;background:#1473E6;"></td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <div style="margin-bottom:24px;">
            <span style="display:inline-block;background:#FA0F00;width:28px;height:28px;border-radius:4px;text-align:center;line-height:28px;font-size:14px;color:#fff;font-weight:bold;">✍</span>
            <span style="font-size:16px;font-weight:bold;color:#1B1B1B;vertical-align:middle;margin-left:10px;">E·SIGN</span>
          </div>
          <h1 style="font-size:20px;font-weight:bold;color:#1B1B1B;margin:0 0 8px;">${greeting}</h1>
          <p style="font-size:14px;color:#555;margin:0 0 16px;">
            <strong>${senderName || 'Un expéditeur'}</strong> vous a envoyé un document à signer :
            <strong>${documentTitle}</strong>
          </p>
          ${message ? `<p style="font-size:13px;color:#666;background:#F8F8F8;border-left:3px solid #1473E6;padding:12px 16px;margin:0 0 24px;">${message}</p>` : ''}
          <div style="text-align:center;margin:32px 0;">
            <a href="${signingUrl}" style="display:inline-block;background:#1473E6;color:#fff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:2px;">
              Consulter et signer le document
            </a>
          </div>
          <p style="font-size:11px;color:#AAAAAA;margin:24px 0 0;text-align:center;">
            Si le bouton ne fonctionne pas :<br>
            <a href="${signingUrl}" style="color:#1473E6;word-break:break-all;">${signingUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 40px;background:#F8F8F8;border-top:1px solid #E8E8E8;">
          <p style="font-size:11px;color:#AAAAAA;margin:0;text-align:center;">Ce lien est unique et personnel. Ne le partagez pas.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

export async function sendSignedPdfEmail({ recipientName, recipientEmail, senderName, documentTitle, pdfBuffer, filename }) {
  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,'
  await send({
    to:      recipientEmail,
    subject: `Votre document signé — ${documentTitle}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:2px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.1);">
        <tr><td style="height:4px;background:#2DA44E;"></td></tr>
        <tr><td style="padding:40px;">
          <h1 style="font-size:20px;font-weight:bold;color:#1B1B1B;margin:0 0 12px;">${greeting}</h1>
          <p style="font-size:14px;color:#555;margin:0 0 16px;">
            Votre signature sur <strong>${documentTitle}</strong> a bien été enregistrée.<br>
            Votre exemplaire signé est en pièce jointe.
          </p>
          <div style="background:#F0FAF4;border:1px solid #A5D6A7;border-radius:4px;padding:16px;margin:24px 0;">
            <p style="margin:0;font-size:13px;font-weight:bold;color:#1B5E20;">📄 ${filename}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#388E3C;">Document PDF signé électroniquement</p>
          </div>
        </td></tr>
        <tr><td style="padding:16px 40px;background:#F8F8F8;border-top:1px solid #E8E8E8;">
          <p style="font-size:11px;color:#AAAAAA;margin:0;text-align:center;">Envoyé via E·SIGN</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    attachments: [{ filename, content: pdfBuffer }],
  })
}

export async function sendReminderEmail({ recipientName, recipientEmail, senderName, documentTitle, signingUrl }) {
  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,'
  await send({
    to:      recipientEmail,
    subject: `Rappel : document en attente de votre signature — ${documentTitle}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:2px;overflow:hidden;">
        <tr><td style="height:4px;background:#F59E0B;"></td></tr>
        <tr><td style="padding:40px;">
          <h1 style="font-size:18px;color:#1B1B1B;margin:0 0 12px;">${greeting}</h1>
          <p style="font-size:14px;color:#555;margin:0 0 24px;">
            Rappel : le document <strong>${documentTitle}</strong> envoyé par
            <strong>${senderName || 'votre expéditeur'}</strong> attend votre signature.
          </p>
          <div style="text-align:center;">
            <a href="${signingUrl}" style="display:inline-block;background:#1473E6;color:#fff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:2px;">
              Signer maintenant
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}
