import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '../../uploads')

// Reference render width used in the frontend (max pageWidth)
const RENDER_WIDTH = 794

function sniffFormat(bytes) {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf'   // %PDF
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png'   // \x89PNG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg'                        // JPEG SOI
  return 'unknown'
}

/**
 * Build a signed PDF from a document + its fields + all recipients' signatures.
 * Returns a Buffer containing the final PDF bytes.
 */
export async function buildSignedPdf(doc, fields, recipients) {
  const filePath = path.join(UPLOAD_DIR, doc.file_path)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable sur le serveur. Le fichier a peut-être été perdu après un redémarrage. Veuillez re-téléverser le document.`)
  }

  const fileBytes = fs.readFileSync(filePath)
  const fmt = sniffFormat(fileBytes)
  let pdfDoc

  if (fmt === 'pdf') {
    pdfDoc = await PDFDocument.load(fileBytes)
  } else if (fmt === 'png' || fmt === 'jpeg') {
    pdfDoc = await PDFDocument.create()
    const img = fmt === 'png'
      ? await pdfDoc.embedPng(fileBytes)
      : await pdfDoc.embedJpg(fileBytes)
    const page = pdfDoc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  } else {
    throw new Error(`Format de fichier non supporté pour la génération PDF (format détecté : ${fmt}). Utilisez PDF, PNG ou JPEG.`)
  }

  const pages      = pdfDoc.getPages()
  const helvetica  = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const cursive    = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)

  // Merge all signatures from all recipients (field_id → signature data)
  const sigMap = {}
  for (const r of recipients) {
    for (const [fieldId, data] of Object.entries(r.signatures ?? {})) {
      if (!sigMap[fieldId]) sigMap[fieldId] = data
    }
  }

  for (const field of fields) {
    const sig = sigMap[field.id]
    if (!sig) continue

    const pageIndex = (field.page ?? 1) - 1
    const page = pages[pageIndex]
    if (!page) continue

    const { width: pdfW, height: pdfH } = page.getSize()
    const scale = pdfW / RENDER_WIDTH

    // Convert browser-space (top-left origin) → PDF-space (bottom-left origin)
    const x  = field.x             * scale
    const y  = pdfH - (field.y + field.height) * scale
    const w  = field.width          * scale
    const h  = field.height         * scale

    await embedSignature({ pdfDoc, page, sig, x, y, w, h, helvetica, cursive })
  }

  // Add a discreet audit footer on the last page
  const lastPage = pages[pages.length - 1]
  const { width: lw } = lastPage.getSize()
  lastPage.drawText(
    `Document signé électroniquement via E·SIGN · ${new Date().toLocaleString('fr-FR')}`,
    { x: 20, y: 10, size: 7, font: helvetica, color: rgb(0.6, 0.6, 0.6) }
  )

  return Buffer.from(await pdfDoc.save())
}

async function embedSignature({ pdfDoc, page, sig, x, y, w, h, helvetica, cursive }) {
  switch (sig.type) {
    case 'draw': {
      if (!sig.image) return
      try {
        const b64 = sig.image.replace(/^data:image\/png;base64,/, '')
        const imgBytes = Buffer.from(b64, 'base64')
        const img = await pdfDoc.embedPng(imgBytes)
        // Keep aspect ratio, center in field
        const ratio     = img.width / img.height
        const drawH     = h
        const drawW     = Math.min(w, drawH * ratio)
        const offsetX   = (w - drawW) / 2
        page.drawImage(img, { x: x + offsetX, y, width: drawW, height: drawH })
      } catch { /* skip malformed image */ }
      break
    }

    case 'type': {
      if (!sig.text) return
      // Draw a subtle underline + text in cursive font
      const fontSize = Math.max(8, Math.min(h * 0.55, 28))
      const textW    = cursive.widthOfTextAtSize(sig.text, fontSize)
      const textX    = x + Math.max(0, (w - textW) / 2)
      const textY    = y + (h - fontSize) / 2 + 2

      // Underline
      page.drawLine({
        start: { x, y: y + 2 }, end: { x: x + w, y: y + 2 },
        thickness: 0.5, color: rgb(0.7, 0.7, 0.7),
      })
      page.drawText(sig.text, {
        x: textX, y: textY, size: fontSize, font: cursive,
        color: rgb(0.04, 0.18, 0.45),
      })
      break
    }

    case 'text': {
      if (!sig.text) return
      const fontSize = Math.max(7, Math.min(h * 0.52, 12))
      page.drawText(sig.text, {
        x: x + 3, y: y + (h - fontSize) / 2 + 1,
        size: fontSize, font: helvetica, color: rgb(0.1, 0.1, 0.1),
        maxWidth: w - 6,
      })
      break
    }

    case 'checkbox': {
      if (!sig.checked) return
      const s = Math.min(w, h)
      page.drawRectangle({
        x, y, width: s, height: s,
        borderColor: rgb(0.04, 0.25, 0.55), borderWidth: 1,
        color: rgb(0.86, 0.93, 1),
      })
      // Checkmark via two lines
      page.drawLine({
        start: { x: x + s * 0.15, y: y + s * 0.45 },
        end:   { x: x + s * 0.42, y: y + s * 0.20 },
        thickness: s * 0.1, color: rgb(0.04, 0.25, 0.55),
      })
      page.drawLine({
        start: { x: x + s * 0.42, y: y + s * 0.20 },
        end:   { x: x + s * 0.85, y: y + s * 0.72 },
        thickness: s * 0.1, color: rgb(0.04, 0.25, 0.55),
      })
      break
    }
  }
}
