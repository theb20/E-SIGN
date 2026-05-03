import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getSigningSession, submitSignature, completeDocument, refuseDocument, fileUrl } from '../api.js'

const SIGN_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api'
import Header from '../components/Header.jsx'
import FieldPalette from '../components/FieldPalette.jsx'
import DocumentCanvas from '../components/DocumentCanvas.jsx'
import PropertiesPanel from '../components/PropertiesPanel.jsx'
import SignatureModal from '../components/SignatureModal.jsx'

export default function SigningPage() {
  const { token } = useParams()
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [session, setSession]   = useState(null) // { document, fileUrl, fields }
  const [signatures, setSignatures] = useState({})
  const [signingId, setSigningId]   = useState(null)
  const [editingId, setEditingId]   = useState(null)
  const [completed, setCompleted]   = useState(false)
  const [refused,   setRefused]     = useState(false)
  const [refuseModal, setRefuseModal] = useState(false)
  const [refuseReason, setRefuseReason] = useState('')
  const [refusing,  setRefusing]    = useState(false)

  /* ── load session ───────────────────────────────────────── */
  useEffect(() => {
    getSigningSession(token)
      .then(data => {
        setSession(data)
        setSignatures(data.signatures ?? {})
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  /* ── field click ────────────────────────────────────────── */
  const handleFieldClick = useCallback((id) => {
    const field = session?.fields?.find(f => f.id === id)
    if (!field) return
    if (field.type === 'signature' || field.type === 'initials') {
      setSigningId(id)
    } else if (field.type === 'checkbox') {
      const data = { type: 'checkbox', checked: true }
      setSignatures(p => ({ ...p, [id]: p[id] ? null : data }))
      submitSignature(token, id, 'checkbox', data).catch(console.error)
    } else {
      setEditingId(id)
    }
  }, [session, token])

  /* ── save signature ─────────────────────────────────────── */
  const saveSignature = useCallback(async (fieldId, data) => {
    setSignatures(p => ({ ...p, [fieldId]: data }))
    setSigningId(null)
    await submitSignature(token, fieldId, data.type, data)
  }, [token])

  /* ── commit text/date ───────────────────────────────────── */
  const commitText = useCallback(async (fieldId, text) => {
    if (!text.trim()) { setEditingId(null); return }
    const data = { type: 'text', text }
    setSignatures(p => ({ ...p, [fieldId]: data }))
    setEditingId(null)
    await submitSignature(token, fieldId, 'text', data)
  }, [token])

  /* ── refuse ────────────────────────────────────────────── */
  const handleRefuse = useCallback(async () => {
    setRefusing(true)
    try {
      await refuseDocument(token, refuseReason)
      setRefuseModal(false)
      setRefused(true)
    } catch (err) {
      console.error(err)
    } finally {
      setRefusing(false)
    }
  }, [token, refuseReason])

  /* ── complete + auto-download ───────────────────────────── */
  const handleComplete = useCallback(async () => {
    await completeDocument(token)
    setCompleted(true)
    // Trigger automatic PDF download
    const a = document.createElement('a')
    a.href = `${SIGN_BASE}/sign/${token}/export`
    a.download = `${session?.document?.title ?? 'document'}_signé.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [token, session])

  /* ── derived ────────────────────────────────────────────── */
  const fields       = session?.fields ?? []
  const required     = fields.filter(f => f.required)
  const allSigned    = required.length > 0 && required.every(f => signatures[f.id])
  const nextUnsigned = required.find(f => !signatures[f.id])
  const signingField = fields.find(f => f.id === signingId) ?? null

  const goToNext = () => {
    if (nextUnsigned) document.getElementById(`f-${nextUnsigned.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /* ── render ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-[#525659] flex items-center justify-center">
      <div className="text-white/60 text-sm">Chargement du document…</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-8">
      <div className="bg-white p-8 max-w-sm w-full text-center" style={{ borderRadius: '2px', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-[16px] font-bold text-[#1B1B1B] mb-2">Lien invalide</h2>
        <p className="text-[13px] text-[#888]">{error}</p>
      </div>
    </div>
  )

  if (refused) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-md p-8 text-center" style={{ borderRadius: '2px', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}>
        <div className="h-1.5 bg-[#CC0000] rounded-t-sm -mt-8 -mx-8 mb-8" />
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-[20px] font-bold text-[#1B1B1B] mb-2">Signature refusée</h1>
        <p className="text-[13px] text-[#888]">
          Vous avez refusé de signer le document <strong>{session?.document?.title}</strong>.<br />
          L'expéditeur a été notifié.
        </p>
      </div>
    </div>
  )

  if (completed) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-md p-8 text-center" style={{ borderRadius: '2px', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}>
        <div className="h-1.5 bg-[#2DA44E] rounded-t-sm -mt-8 -mx-8 mb-8" />
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#E8F5E9] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#2DA44E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[20px] font-bold text-[#1B1B1B] mb-2">Signature complète !</h1>
        <p className="text-[13px] text-[#888] mb-6">
          Merci {session?.document?.recipientName}.<br />
          Le document <strong>{session?.document?.title}</strong> a été signé avec succès.
        </p>
        <p className="text-[11px] text-[#BBBBBB] mb-6">
          {session?.document?.senderName} sera notifié de votre signature.
        </p>
        <a
          href={`${SIGN_BASE}/sign/${token}/export`}
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ background: '#2DA44E', borderRadius: '2px' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger le document signé
        </a>
      </div>
    </div>
  )

  const doc = session
    ? { url: fileUrl(session.document.id), type: session.document.fileType, name: session.document.fileName }
    : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#2B2B2B]">
      {/* Simplified header for recipient */}
      <div className="h-11 flex items-center px-4 gap-3 shrink-0 border-b border-black/40 bg-[#2B2B2B]">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FA0F00]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 20 20">
            <path d="M3 3h9l5 5v9H3V3z" fill="white" />
          </svg>
        </div>
        <span className="text-[#EBEBEB] text-xs font-semibold tracking-widest hidden sm:block">E·SIGN</span>
        <div className="w-px h-5 bg-white/15 shrink-0" />
        <span className="text-[#C0C0C0] text-xs truncate flex-1">{session?.document?.fileName}</span>
        {session?.document?.senderName && (
          <span className="text-[#888] text-xs hidden sm:block shrink-0">
            De : {session.document.senderName}
          </span>
        )}
        <button
          onClick={() => setRefuseModal(true)}
          className="shrink-0 flex items-center gap-1.5 h-7 px-3 text-[#CC4444] text-xs font-semibold border border-[#CC4444]/30 hover:bg-[#CC4444]/10 transition-colors"
          style={{ borderRadius: '2px' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Refuser
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FieldPalette
          mode="sign" fields={fields} signatures={signatures}
          nextUnsignedId={nextUnsigned?.id}
          onFieldClick={handleFieldClick}
        />

        <DocumentCanvas
          doc={doc} fields={fields}
          selectedId={null} editingId={editingId}
          placingType={null} signatures={signatures} mode="sign"
          onPlaceField={() => {}}
          onSelectField={() => {}}
          onMoveField={() => {}}
          onResizeField={() => {}}
          onFieldClick={handleFieldClick}
          onCommitText={commitText}
          onCancelEdit={() => setEditingId(null)}
        />

        <PropertiesPanel
          mode="sign" selectedField={null}
          fields={fields} signatures={signatures}
          nextUnsigned={nextUnsigned} allSigned={allSigned}
          onUpdate={() => {}} onDelete={() => {}}
          onGoToNext={goToNext}
          onSignField={handleFieldClick}
          onComplete={handleComplete}
        />
      </div>

      {signingField && (
        <SignatureModal field={signingField} onSave={saveSignature} onClose={() => setSigningId(null)} />
      )}

      {/* Refuse modal */}
      {refuseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white w-full max-w-[420px]" style={{ borderRadius: '2px', boxShadow: '0 4px 32px rgba(0,0,0,0.35)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E8]">
              <h2 className="text-[14px] font-bold text-[#1B1B1B]">Refuser la signature</h2>
              <button onClick={() => setRefuseModal(false)} className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F5F5] rounded text-[#999]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-[#555] mb-4">
                Vous êtes sur le point de refuser de signer <strong>{session?.document?.title}</strong>. Cette action est irréversible.
              </p>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1.5">
                Motif du refus (optionnel)
              </label>
              <textarea
                value={refuseReason}
                onChange={e => setRefuseReason(e.target.value)}
                placeholder="Expliquez votre refus…"
                rows={3}
                className="w-full border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#333] focus:outline-none focus:border-[#CC4444] resize-none"
                style={{ borderRadius: '2px' }}
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button onClick={() => setRefuseModal(false)} className="px-4 py-2 text-[13px] text-[#555] hover:bg-[#F5F5F5] rounded transition-colors">
                Annuler
              </button>
              <button
                onClick={handleRefuse} disabled={refusing}
                className="px-5 py-2 text-white text-[13px] font-semibold disabled:opacity-50 transition-all"
                style={{ background: '#CC4444', borderRadius: '2px' }}
              >
                {refusing ? 'En cours…' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
