import { useState } from 'react'
import { sendDocument } from '../api.js'
import { SIGNER_COLORS } from './FieldPalette'

export default function SendScreen({ documentId, signerCount = 1, onBack, onSent }) {
  const [sendMode,    setSendMode]    = useState('sequential') // 'sequential' | 'bulk'
  const [senderName,  setSenderName]  = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [message,     setMessage]     = useState('')

  // Sequential mode: fixed list matching signerCount
  const [recipients, setRecipients] = useState(() =>
    Array.from({ length: signerCount }, () => ({ name: '', email: '' }))
  )

  // Bulk mode: free-form list
  const [bulkList,    setBulkList]    = useState([{ name: '', email: '' }])

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [result,   setResult]   = useState(null)
  const [copied,   setCopied]   = useState(null)

  const updateRecipient = (i, field, value) =>
    setRecipients(p => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const updateBulk = (i, field, value) =>
    setBulkList(p => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const addBulkRow    = () => setBulkList(p => [...p, { name: '', email: '' }])
  const removeBulkRow = (i) => setBulkList(p => p.filter((_, idx) => idx !== i))

  const copyLink = async (url, id) => {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSend = async () => {
    setError(null)
    const list = sendMode === 'bulk' ? bulkList : recipients
    const invalid = list.filter(r => !r.email?.trim() || !r.email.includes('@'))
    if (invalid.length) { setError('Veuillez saisir des adresses email valides.'); return }

    try {
      setLoading(true)
      const res = await sendDocument(documentId, {
        senderName:  senderName.trim(),
        senderEmail: senderEmail.trim(),
        message:     message.trim(),
        recipients:  list.map(r => ({ name: r.name.trim(), email: r.email.trim() })),
        bulkSend:    sendMode === 'bulk',
      })
      setResult(res.recipients)
      onSent?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success view ──────────────────────────────────────────── */
  if (result) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-8">
      <div className="w-full max-w-xl bg-white" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.1)', borderRadius: '2px' }}>
        <div className="h-1 rounded-t-sm" style={{ background: sendMode === 'bulk' ? '#7B4FFF' : '#2DA44E' }} />
        <div className="p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: sendMode === 'bulk' ? '#F3EEFF' : '#E8F5E9' }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: sendMode === 'bulk' ? '#7B4FFF' : '#2DA44E' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-center text-[20px] font-bold text-[#1B1B1B] mb-1">Document envoyé !</h1>
          <p className="text-center text-[13px] text-[#888] mb-1">
            {result.length} destinataire{result.length > 1 ? 's' : ''} notifié{result.length > 1 ? 's' : ''} par email.
          </p>
          {sendMode === 'bulk' && (
            <p className="text-center text-[12px] mb-5 font-medium" style={{ color: '#7B4FFF' }}>
              Envoi groupé — chacun signe indépendamment
            </p>
          )}

          <div className="space-y-2 mb-6">
            {result.map((r, i) => (
              <div key={r.id} className="border border-[#E8E8E8] p-3 flex items-center gap-3" style={{ borderRadius: '2px' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
                  style={{ background: sendMode === 'bulk' ? '#7B4FFF' : SIGNER_COLORS[i % SIGNER_COLORS.length] }}>
                  {sendMode === 'bulk' ? (r.name || r.email)[0].toUpperCase() : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {r.name && <div className="text-[12px] font-semibold text-[#1B1B1B] truncate">{r.name}</div>}
                  <div className="text-[11px] text-[#888] truncate">{r.email}</div>
                </div>
                <button
                  onClick={() => copyLink(r.signingUrl, r.id)}
                  className="shrink-0 px-3 py-1.5 text-[11px] font-semibold text-white transition-all"
                  style={{ background: copied === r.id ? '#2DA44E' : '#1473E6', borderRadius: '2px' }}
                >
                  {copied === r.id ? '✓ Copié' : 'Copier lien'}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onBack}
            className="w-full h-9 border border-[#CCCCCC] text-[13px] font-medium text-[#555] hover:bg-[#F5F5F5] transition-colors"
            style={{ borderRadius: '2px' }}
          >
            ← Retour à l'éditeur
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Send form ────────────────────────────────────────────── */
  const accentColor = sendMode === 'bulk' ? '#7B4FFF' : '#1473E6'

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-8">
      <div className="w-full max-w-xl bg-white" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.1)', borderRadius: '2px' }}>
        <div className="h-1 rounded-t-sm" style={{ background: accentColor }} />
        <div className="p-8">
          <h1 className="text-[20px] font-bold text-[#1B1B1B] mb-5">Envoyer pour signature</h1>

          {/* Mode toggle */}
          <div className="flex mb-6 border border-[#E0E0E0]" style={{ borderRadius: '2px' }}>
            <button
              onClick={() => setSendMode('sequential')}
              className="flex-1 py-2.5 text-[12px] font-semibold transition-all"
              style={{
                background: sendMode === 'sequential' ? '#1473E6' : 'white',
                color:      sendMode === 'sequential' ? 'white' : '#555',
                borderRight: '1px solid #E0E0E0',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Multi-signatures
              </div>
              <p className="text-[10px] font-normal mt-0.5 opacity-80">Chacun signe des champs différents</p>
            </button>
            <button
              onClick={() => setSendMode('bulk')}
              className="flex-1 py-2.5 text-[12px] font-semibold transition-all"
              style={{
                background: sendMode === 'bulk' ? '#7B4FFF' : 'white',
                color:      sendMode === 'bulk' ? 'white' : '#555',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Envoi groupé
              </div>
              <p className="text-[10px] font-normal mt-0.5 opacity-80">Même document, chacun signe seul</p>
            </button>
          </div>

          {/* Sender info */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2">Expéditeur</p>
            <div className="flex gap-2 mb-2">
              <input
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="Votre nom"
                className="flex-1 border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#1B1B1B] outline-none"
                style={{ borderRadius: '2px' }}
              />
              <input
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="Votre email"
                type="email"
                className="flex-1 border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#1B1B1B] outline-none"
                style={{ borderRadius: '2px' }}
              />
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Message pour les destinataires (optionnel)"
              rows={2}
              className="w-full border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#1B1B1B] outline-none resize-none"
              style={{ borderRadius: '2px' }}
            />
          </div>

          {/* Sequential recipients */}
          {sendMode === 'sequential' && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-3">
                Signataires ({recipients.length})
              </p>
              <div className="space-y-3">
                {recipients.map((r, i) => {
                  const c = SIGNER_COLORS[i % SIGNER_COLORS.length]
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: c }}>
                          {i + 1}
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: c }}>Signataire {i + 1}</span>
                      </div>
                      <div className="flex gap-2 pl-7">
                        <input
                          value={r.name}
                          onChange={e => updateRecipient(i, 'name', e.target.value)}
                          placeholder="Prénom Nom"
                          className="flex-1 border px-3 py-2 text-[13px] text-[#1B1B1B] outline-none"
                          style={{ borderRadius: '2px', borderColor: r.name ? c : '#CCCCCC' }}
                        />
                        <input
                          value={r.email}
                          onChange={e => updateRecipient(i, 'email', e.target.value)}
                          placeholder="email@exemple.com"
                          type="email"
                          className="flex-1 border px-3 py-2 text-[13px] text-[#1B1B1B] outline-none"
                          style={{ borderRadius: '2px', borderColor: r.email ? c : '#CCCCCC' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bulk recipients */}
          {sendMode === 'bulk' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider">
                  Destinataires ({bulkList.length})
                </p>
                <button
                  onClick={addBulkRow}
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: '#7B4FFF' }}
                >
                  + Ajouter
                </button>
              </div>

              <div className="p-3 mb-3 text-[11px] rounded" style={{ background: '#F3EEFF', color: '#6B3FCC', borderRadius: '2px' }}>
                Chaque personne recevra sa propre copie du document à signer indépendamment.
              </div>

              <div className="space-y-2">
                {bulkList.map((r, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={r.name}
                      onChange={e => updateBulk(i, 'name', e.target.value)}
                      placeholder="Prénom Nom"
                      className="flex-1 border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#1B1B1B] outline-none"
                      style={{ borderRadius: '2px' }}
                    />
                    <input
                      value={r.email}
                      onChange={e => updateBulk(i, 'email', e.target.value)}
                      placeholder="email@exemple.com"
                      type="email"
                      className="flex-1 border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#1B1B1B] outline-none"
                      style={{ borderRadius: '2px' }}
                    />
                    {bulkList.length > 1 && (
                      <button
                        onClick={() => removeBulkRow(i)}
                        className="w-8 h-8 flex items-center justify-center text-[#AAAAAA] hover:text-[#CC0000] shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-[12px] text-red-600" style={{ borderRadius: '2px' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 h-10 border border-[#CCCCCC] text-[13px] font-medium text-[#555] hover:bg-[#F5F5F5] transition-colors"
              style={{ borderRadius: '2px' }}
            >
              ← Retour
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 h-10 text-white text-[13px] font-semibold transition-all disabled:opacity-60"
              style={{ background: accentColor, borderRadius: '2px' }}
            >
              {loading
                ? 'Envoi en cours…'
                : sendMode === 'bulk'
                ? `Envoi groupé → ${bulkList.length} personne${bulkList.length > 1 ? 's' : ''}`
                : `Envoyer à ${recipients.length} signataire${recipients.length > 1 ? 's' : ''}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
