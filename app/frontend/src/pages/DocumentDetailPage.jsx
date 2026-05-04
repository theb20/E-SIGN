import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocumentDetail, fileUrl, exportUrl, recipientExportUrl, cancelDocument, sendReminder } from '../api.js'

const SIGNER_COLORS = ['#1473E6', '#7B4FFF', '#E87722', '#2DA44E', '#CC0000', '#0891B2']

const STATUS_COLOR = {
  draft:     { bg: '#F5F5F5', text: '#888888', dot: '#CCCCCC' },
  pending:   { bg: '#FFF8E7', text: '#B45309', dot: '#F59E0B' },
  completed: { bg: '#F0FAF4', text: '#166534', dot: '#2DA44E' },
}
const STATUS_LABEL = { draft: 'Brouillon', pending: 'En attente', completed: 'Complété' }

const EVENT_META = {
  created:            { label: 'Document créé',             color: '#888888', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  sent:               { label: 'Document envoyé',           color: '#1473E6', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  viewed:             { label: 'Lien ouvert',               color: '#7B4FFF', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  field_signed:       { label: 'Champ signé',               color: '#E87722', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  completed:          { label: 'Destinataire a complété',   color: '#2DA44E', icon: 'M5 13l4 4L19 7' },
  document_completed: { label: 'Document entièrement signé', color: '#2DA44E', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] ?? STATUS_COLOR.draft
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full"
      style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [copied,      setCopied]      = useState(null)
  const [cancelling,  setCancelling]  = useState(false)
  const [reminding,   setReminding]   = useState(null)

  useEffect(() => {
    getDocumentDetail(id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Annuler ce document ? Cette action est irréversible.')) return
    setCancelling(true)
    try {
      await cancelDocument(data.document.id)
      setData(d => ({ ...d, document: { ...d.document, status: 'cancelled' } }))
    } catch (err) {
      alert(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const handleRemind = async (recipientId) => {
    setReminding(recipientId)
    try {
      await sendReminder(data.document.id, recipientId)
      setTimeout(() => setReminding(null), 2000)
    } catch (err) {
      alert(err.message)
      setReminding(null)
    }
  }

  const copyLink = async (url, recipientId) => {
    const baseUrl = window.location.origin
    await navigator.clipboard.writeText(`${baseUrl}/sign/${url}`)
    setCopied(recipientId)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
      <span className="text-[13px] text-[#AAAAAA]">Chargement…</span>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-[14px] text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-[13px] text-[#1473E6] hover:underline">← Retour</button>
      </div>
    </div>
  )

  const { document: doc, fields, recipients, auditLogs } = data
  const signedCount  = recipients.filter(r => r.status === 'completed').length
  const allSigned    = recipients.length > 0 && signedCount === recipients.length
  const hasSigs      = recipients.some(r => Object.keys(r.signatures ?? {}).length > 0)
  const exportHref   = exportUrl(doc.id)

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Topbar */}
      <div className="h-12 bg-[#2B2B2B] flex items-center px-3 sm:px-6 gap-2 sm:gap-3 border-b border-black/40">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 sm:gap-1.5 text-[#888] hover:text-white transition-colors text-xs shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Documents</span>
        </button>
        <div className="w-px h-5 bg-white/15 shrink-0" />
        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#FA0F00] shrink-0">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 20 20">
            <path d="M3 3h9l5 5v9H3V3z" fill="white" />
          </svg>
        </div>
        <span className="text-[#C0C0C0] text-xs truncate flex-1 min-w-0">{doc.title}</span>
        <StatusBadge status={doc.status} />
        {['draft','pending'].includes(doc.status) && (
          <button
            onClick={handleCancel} disabled={cancelling}
            className="flex items-center gap-1.5 h-7 px-3 text-[#CC4444] text-xs font-semibold border border-[#CC4444]/30 hover:bg-[#CC4444]/10 transition-colors disabled:opacity-50 shrink-0"
            style={{ borderRadius: '2px' }}
          >
            {cancelling ? '…' : 'Annuler'}
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* Document info card */}
        <div className="bg-white border border-[#E8E8E8]" style={{ borderRadius: '2px' }}>
          <div className="h-1 rounded-t-sm" style={{ background: doc.status === 'completed' ? '#2DA44E' : '#1473E6' }} />
          <div className="p-6">
            <div className="flex flex-wrap gap-6 items-start">
              {/* Icon */}
              <div className="w-12 h-14 rounded flex items-center justify-center shrink-0"
                style={{ background: doc.file_type === 'pdf' ? '#FFF0F0' : '#F0F4FF', border: '1px solid #EEEEEE' }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: doc.file_type === 'pdf' ? '#FA0F00' : '#1473E6' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-[18px] font-bold text-[#1B1B1B]">{doc.title}</h1>
                <p className="text-[12px] text-[#888] mt-0.5">{doc.file_name}</p>
                {doc.message && (
                  <p className="text-[12px] text-[#555] mt-2 italic border-l-2 border-[#DDDDDD] pl-2">{doc.message}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0 flex-wrap">
                <a href={fileUrl(doc.id)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-[#DDDDDD] text-[#555] hover:bg-[#F5F5F5] transition-colors"
                  style={{ borderRadius: '2px' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Original
                </a>

                {hasSigs && (
                  <a href={exportHref}
                    download
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: allSigned ? '#2DA44E' : '#1473E6', borderRadius: '2px' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    {allSigned ? 'Télécharger document signé' : 'Télécharger (partiel)'}
                  </a>
                )}
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex gap-8 flex-wrap text-[12px] mt-5 pt-5 border-t border-[#F0F0F0]">
              {[
                { label: 'Expéditeur', value: doc.sender_name || '—' },
                { label: 'Email',      value: doc.sender_email || '—' },
                { label: 'Créé le',    value: fmt(doc.created_at) },
                { label: 'Champs',     value: `${fields.length} champ${fields.length !== 1 ? 's' : ''}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-[#333] font-medium">{value}</p>
                </div>
              ))}
              {doc.completed_at && (
                <div>
                  <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-0.5">Complété le</p>
                  <p className="text-[#2DA44E] font-medium">{fmt(doc.completed_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Downloads section */}
        {hasSigs && (
          <div className="bg-white border border-[#E8E8E8]" style={{ borderRadius: '2px' }}>
            <div className="px-5 py-3.5 border-b border-[#F0F0F0]">
              <h2 className="text-[13px] font-bold text-[#1B1B1B]">Téléchargements</h2>
              <p className="text-[11px] text-[#AAAAAA] mt-0.5">Téléchargez les documents signés individuellement ou groupés</p>
            </div>

            <div className="p-5 space-y-4">

              {/* Grouped / combined PDF */}
              <div className="border border-[#E8E8E8] p-4 flex items-center gap-4" style={{ borderRadius: '2px' }}>
                <div className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                  style={{ background: allSigned ? '#F0FAF4' : '#EEF5FF', border: '1px solid #EEEEEE' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: allSigned ? '#2DA44E' : '#1473E6' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1B1B1B]">Document groupé</p>
                  <p className="text-[11px] text-[#888] mt-0.5">
                    Toutes les signatures dans un seul PDF
                    {' · '}<span style={{ color: allSigned ? '#2DA44E' : '#E87722', fontWeight: 600 }}>
                      {signedCount}/{recipients.length} signé{signedCount !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <a href={exportHref} download
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
                  style={{ background: allSigned ? '#2DA44E' : '#1473E6', borderRadius: '2px' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  {allSigned ? 'Télécharger' : 'Télécharger (partiel)'}
                </a>
              </div>

              {/* Individual per recipient */}
              <div>
                <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-2 px-1">Par signataire</p>
                <div className="space-y-2">
                  {recipients.map((r, i) => {
                    const c = SIGNER_COLORS[i % SIGNER_COLORS.length]
                    const done = r.status === 'completed'
                    return (
                      <div key={r.id}
                        className="border p-3 flex items-center gap-3"
                        style={{ borderRadius: '2px', borderColor: done ? '#D4EDDA' : '#EEEEEE', background: done ? '#FAFFFE' : 'white' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ background: c }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#1B1B1B] truncate">{r.name || r.email}</p>
                          {r.name && <p className="text-[11px] text-[#AAAAAA] truncate">{r.email}</p>}
                        </div>
                        {done ? (
                          <a href={recipientExportUrl(doc.id, r.id)} download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
                            style={{ background: '#2DA44E', borderRadius: '2px' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            Télécharger
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[#FFF8E7] text-[#B45309] shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            En attente
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* PDF preview (PDF only) */}
            {doc.file_type === 'pdf' && (
              <div className="border-t border-[#F0F0F0]">
                <div className="px-5 py-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-wider">Aperçu (document groupé)</p>
                </div>
                <div className="px-4 pb-4">
                  <iframe
                    src={`${exportHref}?inline=1`}
                    className="w-full border border-[#E8E8E8]"
                    style={{ height: '550px', borderRadius: '2px' }}
                    title="Aperçu signé"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recipients */}
        <div className="bg-white border border-[#E8E8E8]" style={{ borderRadius: '2px' }}>
          <div className="px-5 py-3.5 border-b border-[#F0F0F0] flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-[#1B1B1B]">Destinataires</h2>
            <span className="text-[11px] text-[#888]">{signedCount}/{recipients.length} signé{signedCount !== 1 ? 's' : ''}</span>
          </div>

          {recipients.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-[#AAAAAA]">
              Aucun destinataire — le document n'a pas encore été envoyé.
            </div>
          ) : (
            recipients.map((r, i) => {
              const signerColor = SIGNER_COLORS[i % SIGNER_COLORS.length]
              return (
                <div key={r.id}
                  className="px-5 py-4 flex flex-wrap items-center gap-4"
                  style={{ borderBottom: i < recipients.length - 1 ? '1px solid #F5F5F5' : 'none' }}>

                  {/* Avatar with signer number */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                      style={{ background: signerColor }}>
                      {(r.name || r.email)[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-white"
                      style={{ background: r.status === 'completed' ? '#2DA44E' : '#AAAAAA' }}>
                      {i + 1}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {r.name && <p className="text-[13px] font-semibold text-[#1B1B1B]">{r.name}</p>}
                    <p className="text-[12px] text-[#888]">{r.email}</p>
                  </div>

                  {/* Signed fields count */}
                  <div className="text-center shrink-0">
                    <p className="text-[18px] font-bold" style={{ color: r.status === 'completed' ? '#2DA44E' : signerColor }}>
                      {r.signedCount}
                    </p>
                    <p className="text-[10px] text-[#AAAAAA]">champ{r.signedCount !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {r.status === 'completed' ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#F0FAF4] text-[#166534]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2DA44E]" />
                          Signé
                        </span>
                        <p className="text-[10px] text-[#AAAAAA] mt-0.5 text-right">{fmt(r.completed_at)}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#FFF8E7] text-[#B45309]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          En attente
                        </span>
                        {r.email_sent ? (
                          <p className="text-[10px] text-[#AAAAAA] mt-0.5 text-right">Email envoyé</p>
                        ) : (
                          <p className="text-[10px] text-[#AAAAAA] mt-0.5 text-right">Email non envoyé</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {r.status === 'completed' && (
                      <a
                        href={recipientExportUrl(doc.id, r.id)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: '#2DA44E', borderRadius: '2px' }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Télécharger
                      </a>
                    )}
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRemind(r.id)}
                          disabled={reminding === r.id}
                          className="px-3 py-1.5 text-[11px] font-semibold transition-all border"
                          style={{
                            borderRadius: '2px',
                            border: reminding === r.id ? '1px solid #2DA44E' : '1px solid #E0E0E0',
                            color: reminding === r.id ? '#2DA44E' : '#555',
                            background: reminding === r.id ? '#F0FAF4' : 'white',
                          }}
                        >
                          {reminding === r.id ? '✓ Relancé' : 'Relancer'}
                        </button>
                        <button
                          onClick={() => copyLink(r.signing_token, r.id)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-white transition-all"
                          style={{ background: copied === r.id ? '#2DA44E' : signerColor, borderRadius: '2px' }}
                        >
                          {copied === r.id ? '✓ Copié' : 'Copier lien'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Audit trail */}
        <div className="bg-white border border-[#E8E8E8]" style={{ borderRadius: '2px' }}>
          <div className="px-5 py-3.5 border-b border-[#F0F0F0]">
            <h2 className="text-[13px] font-bold text-[#1B1B1B]">Journal d'audit</h2>
            <p className="text-[11px] text-[#AAAAAA] mt-0.5">{auditLogs.length} événement{auditLogs.length !== 1 ? 's' : ''}</p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-[#AAAAAA]">Aucun événement.</div>
          ) : (
            <div className="px-5 py-4">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-[#EEEEEE]" />

                <div className="space-y-4">
                  {auditLogs.map((log) => {
                    const meta = EVENT_META[log.event] ?? { icon: '•', label: log.event, color: '#888' }
                    return (
                      <div key={log.id} className="flex gap-4 items-start relative">
                        {/* Dot */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 bg-white border-2"
                          style={{ borderColor: meta.color }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            style={{ color: meta.color }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-[12px] font-semibold" style={{ color: meta.color }}>
                              {meta.label}
                            </span>
                            {(log.recipient_name || log.recipient_email) && (
                              <span className="text-[11px] text-[#888]">
                                par {log.recipient_name || log.recipient_email}
                              </span>
                            )}
                            {log.metadata?.senderName && (
                              <span className="text-[11px] text-[#888]">par {log.metadata.senderName}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-0.5">
                            <span className="text-[10px] text-[#BBBBBB]">{fmt(log.created_at)}</span>
                            {log.metadata?.recipientCount && (
                              <span className="text-[10px] text-[#BBBBBB]">· {log.metadata.recipientCount} destinataire{log.metadata.recipientCount > 1 ? 's' : ''}</span>
                            )}
                            {log.metadata?.type && (
                              <span className="text-[10px] text-[#BBBBBB]">· type : {log.metadata.type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
