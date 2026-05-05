const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api'

export async function createDocument(formData) {
  const res = await fetch(`${BASE}/documents`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function saveFields(documentId, fields) {
  const res = await fetch(`${BASE}/documents/${documentId}/fields`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function sendDocument(documentId, payload) {
  const res = await fetch(`${BASE}/documents/${documentId}/send`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function getSigningSession(token) {
  const res = await fetch(`${BASE}/sign/${token}`)
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function submitSignature(token, fieldId, type, data) {
  const res = await fetch(`${BASE}/sign/${token}/signature`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fieldId, type, data }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function completeDocument(token) {
  const res = await fetch(`${BASE}/sign/${token}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function refuseDocument(token, reason) {
  const res = await fetch(`${BASE}/sign/${token}/refuse`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export function fileUrl(documentId) {
  return `${BASE}/documents/${documentId}/file`
}

export async function listDocuments() {
  const res = await fetch(`${BASE}/dashboard/documents`)
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function getDocumentDetail(id) {
  const res = await fetch(`${BASE}/dashboard/documents/${id}`)
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function cancelDocument(id) {
  const res = await fetch(`${BASE}/dashboard/documents/${id}/cancel`, { method: 'POST' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function sendReminder(documentId, recipientId) {
  const res = await fetch(`${BASE}/dashboard/documents/${documentId}/remind/${recipientId}`, { method: 'POST' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export function exportUrl(documentId) {
  return `${BASE}/dashboard/documents/${documentId}/export`
}

export function recipientExportUrl(documentId, recipientId) {
  return `${BASE}/dashboard/documents/${documentId}/export/${recipientId}`
}

/* Templates */
export async function listTemplates() {
  const res = await fetch(`${BASE}/templates`)
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function createTemplate(payload) {
  const res = await fetch(`${BASE}/templates`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function deleteTemplate(id) {
  const res = await fetch(`${BASE}/templates/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function deleteDocument(id) {
  const res = await fetch(`${BASE}/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function clearAllUploads() {
  const res = await fetch(`${BASE}/admin/clear-uploads`, { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}
