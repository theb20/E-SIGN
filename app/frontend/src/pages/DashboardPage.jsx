import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDocuments, exportUrl, deleteDocument, clearAllUploads } from '../api.js'

const STATUS_LABEL = { draft: 'Brouillon', pending: 'En attente', completed: 'Complété', cancelled: 'Annulé', expired: 'Expiré' }
const STATUS_COLOR = {
  draft:     { bg: '#F5F5F5', text: '#888888', dot: '#CCCCCC' },
  pending:   { bg: '#FFF8E7', text: '#B45309', dot: '#F59E0B' },
  completed: { bg: '#F0FAF4', text: '#166534', dot: '#2DA44E' },
  cancelled: { bg: '#FFF0F0', text: '#991B1B', dot: '#CC4444' },
  expired:   { bg: '#F5F5F5', text: '#888888', dot: '#AAAAAA' },
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

function Progress({ signed, total }) {
  if (!total) return <span className="text-[11px] text-[#AAAAAA]">—</span>
  const pct = Math.round((signed / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden" style={{ minWidth: 48 }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct === 100 ? '#2DA44E' : '#1473E6' }} />
      </div>
      <span className="text-[11px] text-[#888] shrink-0">{signed}/{total}</span>
    </div>
  )
}

const STATUS_FILTERS = ['all', 'draft', 'pending', 'completed', 'cancelled']

export default function DashboardPage() {
  const navigate  = useNavigate()
  const [documents,    setDocuments]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected,     setSelected]     = useState(new Set())
  const [deleting,     setDeleting]     = useState(new Set())
  const [clearing,     setClearing]     = useState(false)

  useEffect(() => {
    listDocuments()
      .then(d => setDocuments(d.documents))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return documents.filter(d => {
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [documents, search, statusFilter])

  const allSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id))

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(d => next.delete(d.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(d => next.add(d.id)); return next })
    }
  }

  const handleDelete = async (id) => {
    setDeleting(prev => new Set(prev).add(id))
    try {
      await deleteDocument(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setDeleting(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleDeleteSelected = async () => {
    if (!selected.size) return
    if (!window.confirm(`Supprimer ${selected.size} document(s) sélectionné(s) ?`)) return
    const ids = [...selected]
    for (const id of ids) await handleDelete(id)
    setSelected(new Set())
  }

  const handleClearAll = async () => {
    if (!window.confirm(`Supprimer TOUS les ${documents.length} documents et fichiers ?`)) return
    setClearing(true)
    try {
      await clearAllUploads()
      setDocuments([])
      setSelected(new Set())
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setClearing(false)
    }
  }

  const downloadOne = (doc) => {
    const a = document.createElement('a')
    a.href = exportUrl(doc.id)
    a.download = `${doc.title}_signé.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadSelected = () => {
    const docs = filtered.filter(d => selected.has(d.id))
    docs.forEach((doc, i) => setTimeout(() => downloadOne(doc), i * 600))
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Topbar */}
      <div className="h-12 bg-[#2B2B2B] flex items-center px-3 sm:px-6 gap-3 border-b border-black/40">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FA0F00] shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 20 20">
            <path d="M3 3h9l5 5v9H3V3z" fill="white" opacity="0.95" />
            <path d="M12 3v6h5" stroke="rgba(200,0,0,0.5)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <span className="text-[#EBEBEB] text-xs font-semibold tracking-widest">E·SIGN</span>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-[#888] text-xs flex-1">Tableau de bord</span>

        {/* Tout supprimer */}
        <button
          onClick={handleClearAll}
          disabled={clearing || documents.length === 0}
          className="flex items-center gap-1.5 h-7 px-3 text-[#CC4444] text-xs font-semibold rounded transition-all border border-[#CC4444]/30 hover:bg-[#CC4444]/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">{clearing ? 'Suppression…' : 'Tout supprimer'}</span>
        </button>

        <button
          onClick={() => navigate('/new')}
          className="flex items-center gap-1.5 h-7 px-3.5 text-white text-xs font-semibold rounded transition-all hover:opacity-90"
          style={{ background: '#1473E6' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header + search */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold text-[#1B1B1B]">Documents</h1>
            <p className="text-[13px] text-[#888] mt-0.5">
              {filtered.length} document{filtered.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && <span className="ml-1">· filtre : {STATUS_LABEL[statusFilter]}</span>}
            </p>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAAAAA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full sm:w-[200px] pl-8 pr-3 py-1.5 text-[12px] border border-[#DDDDDD] focus:outline-none focus:border-[#1473E6] transition-colors"
              style={{ borderRadius: '2px' }}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className="px-2.5 py-1 text-[11px] font-semibold transition-all"
                style={{
                  borderRadius: '2px',
                  border: statusFilter === f ? '1.5px solid #1473E6' : '1px solid #DDDDDD',
                  background: statusFilter === f ? '#EEF5FF' : 'white',
                  color: statusFilter === f ? '#1473E6' : '#555',
                }}
              >
                {f === 'all' ? 'Tous' : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Delete selected bar */}
        {selected.size > 0 && (
          <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#FFF0F0] border border-[#FFCCCC]" style={{ borderRadius: '2px' }}>
            <span className="text-[13px] font-semibold text-[#CC4444] flex-1">
              {selected.size} document{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[12px] text-[#888] hover:text-[#333] transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-[12px] font-semibold transition-all hover:opacity-90"
              style={{ background: '#1473E6', borderRadius: '2px' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </button>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-[12px] font-semibold transition-all hover:opacity-90"
              style={{ background: '#CC4444', borderRadius: '2px' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-[13px] text-[#AAAAAA]">Chargement…</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600" style={{ borderRadius: '2px' }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-[#E8E8E8] text-center py-16" style={{ borderRadius: '2px' }}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F5F5F5] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#CCCCCC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {documents.length === 0 ? (
              <>
                <p className="text-[14px] font-semibold text-[#555] mb-1">Aucun document</p>
                <p className="text-[12px] text-[#AAAAAA] mb-5">Commencez par envoyer votre premier document.</p>
                <button
                  onClick={() => navigate('/new')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-[13px] font-semibold"
                  style={{ background: '#1473E6', borderRadius: '2px' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer un document
                </button>
              </>
            ) : (
              <p className="text-[13px] text-[#AAAAAA]">Aucun résultat pour cette recherche.</p>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {filtered.map((doc) => {
                const isSelected = selected.has(doc.id)
                const isDeleting = deleting.has(doc.id)
                return (
                  <div
                    key={doc.id}
                    className="bg-white border flex items-center gap-3 p-3 transition-colors"
                    style={{
                      borderRadius: '2px',
                      borderColor: isSelected ? '#CC4444' : '#E8E8E8',
                      background: isSelected ? '#FFF8F8' : 'white',
                      opacity: isDeleting ? 0.4 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(doc.id)}
                      className="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all"
                      style={{
                        border: isSelected ? '2px solid #CC4444' : '1.5px solid #CCCCCC',
                        background: isSelected ? '#CC4444' : 'white',
                      }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <p className="text-[13px] font-semibold text-[#1B1B1B] truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatusBadge status={doc.status} />
                        <Progress signed={Number(doc.signed_count)} total={Number(doc.recipient_count)} />
                      </div>
                      <p className="text-[10px] text-[#AAAAAA] mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Download button */}
                      <button
                        onClick={() => downloadOne(doc)}
                        className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-[#F0F7FF] text-[#CCCCCC] hover:text-[#1473E6]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => { if (window.confirm(`Supprimer "${doc.title}" ?`)) handleDelete(doc.id) }}
                        disabled={isDeleting}
                        className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-[#FFF0F0] text-[#CCCCCC] hover:text-[#CC4444] disabled:opacity-40"
                      >
                        {isDeleting ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white border border-[#E8E8E8] overflow-hidden" style={{ borderRadius: '2px' }}>
              {/* Table header */}
              <div className="grid gap-4 px-5 py-2.5 border-b border-[#F0F0F0] bg-[#FAFAFA]"
                style={{ gridTemplateColumns: '32px 1fr 110px 100px 110px 90px 64px' }}>
                {/* Select all checkbox */}
                <button
                  onClick={toggleAll}
                  className="w-4 h-4 rounded border flex items-center justify-center transition-all"
                  style={{
                    border: allSelected ? '2px solid #CC4444' : '1.5px solid #CCCCCC',
                    background: allSelected ? '#CC4444' : 'white',
                  }}
                >
                  {allSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {['Document', 'Expéditeur', 'Statut', 'Signatures', 'Date', ''].map((h, i) => (
                  <span key={i} className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider">{h}</span>
                ))}
              </div>

              {filtered.map((doc, i) => {
                const isSelected = selected.has(doc.id)
                const isDeleting = deleting.has(doc.id)
                return (
                  <div
                    key={doc.id}
                    className="grid gap-4 px-5 py-3.5 items-center transition-colors hover:bg-[#F8F8F8]"
                    style={{
                      gridTemplateColumns: '32px 1fr 110px 100px 110px 90px 64px',
                      borderBottom: i < filtered.length - 1 ? '1px solid #F5F5F5' : 'none',
                      background: isSelected ? '#FFF8F8' : undefined,
                      opacity: isDeleting ? 0.4 : 1,
                    }}
                  >
                    {/* Row checkbox */}
                    <button
                      onClick={() => toggleSelect(doc.id)}
                      className="w-4 h-4 rounded border flex items-center justify-center transition-all"
                      style={{
                        border: isSelected ? '2px solid #CC4444' : '1.5px solid #CCCCCC',
                        background: isSelected ? '#CC4444' : 'white',
                      }}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="flex items-center gap-3 min-w-0 text-left"
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                        style={{ background: doc.file_type === 'pdf' ? '#FFF0F0' : '#F0F4FF' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: doc.file_type === 'pdf' ? '#FA0F00' : '#1473E6' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1B1B1B] truncate">{doc.title}</p>
                        <p className="text-[11px] text-[#AAAAAA] truncate">{doc.file_name}</p>
                      </div>
                    </button>

                    <span className="text-[12px] text-[#555] truncate">{doc.sender_name || '—'}</span>
                    <div><StatusBadge status={doc.status} /></div>
                    <Progress signed={Number(doc.signed_count)} total={Number(doc.recipient_count)} />
                    <span className="text-[11px] text-[#AAAAAA]">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-0.5">
                      {/* Download */}
                      <button
                        onClick={() => downloadOne(doc)}
                        className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-[#F0F7FF] text-[#DDDDDD] hover:text-[#1473E6]"
                        title="Télécharger"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => { if (window.confirm(`Supprimer "${doc.title}" ?`)) handleDelete(doc.id) }}
                        disabled={isDeleting}
                        className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-[#FFF0F0] text-[#DDDDDD] hover:text-[#CC4444] disabled:opacity-40"
                        title="Supprimer"
                      >
                        {isDeleting ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
