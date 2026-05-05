import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDocuments, exportUrl } from '../api.js'

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

function DownloadBtn({ doc }) {
  const completed = doc.status === 'completed'
  return (
    <a
      href={exportUrl(doc.id)}
      download
      onClick={e => e.stopPropagation()}
      title={completed ? 'Télécharger le document signé' : 'Télécharger (signatures en cours)'}
      className="inline-flex items-center justify-center w-8 h-8 rounded transition-all"
      style={{
        background:  completed ? '#F0FAF4' : '#F5F5F5',
        border:      `1px solid ${completed ? '#A5D6A7' : '#E0E0E0'}`,
        color:       completed ? '#2DA44E' : '#AAAAAA',
        flexShrink:  0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = completed ? '#E8F5E9' : '#EBEBEB' }}
      onMouseLeave={e => { e.currentTarget.style.background = completed ? '#F0FAF4' : '#F5F5F5' }}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  )
}

const STATUS_FILTERS = ['all', 'draft', 'pending', 'completed', 'cancelled']

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api'

export default function DashboardPage() {
  const navigate  = useNavigate()
  const [documents,    setDocuments]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clearing,     setClearing]     = useState(false)
  const [clearMsg,     setClearMsg]     = useState(null)

  const clearUploads = async () => {
    if (!window.confirm('Supprimer tous les fichiers uploadés sur le serveur ?')) return
    setClearing(true)
    setClearMsg(null)
    try {
      const res = await fetch(`${API}/admin/clear-uploads`, { method: 'DELETE' })
      const data = await res.json()
      setClearMsg(data.error ? `Erreur : ${data.error}` : `${data.deleted} fichier(s) supprimé(s)`)
    } catch {
      setClearMsg('Erreur réseau')
    } finally {
      setClearing(false)
    }
  }

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
        <button
          onClick={clearUploads}
          disabled={clearing}
          title="Supprimer tous les fichiers du serveur"
          className="flex items-center gap-1.5 h-7 px-3 text-[#CC4444] text-xs font-semibold rounded transition-all border border-[#CC4444]/30 hover:bg-[#CC4444]/10 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {clearing ? '…' : 'Vider fichiers'}
        </button>
        {clearMsg && (
          <span className="text-[11px] font-medium" style={{ color: clearMsg.startsWith('Erreur') ? '#CC4444' : '#2DA44E' }}>
            {clearMsg}
          </span>
        )}
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
            {/* Mobile card list (< md) */}
            <div className="md:hidden space-y-2">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-[#E8E8E8] p-3 flex items-center gap-3 transition-colors active:bg-[#F8F8F8]"
                  style={{ borderRadius: '2px' }}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                    style={{ background: doc.file_type === 'pdf' ? '#FFF0F0' : '#F0F4FF' }}>
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: doc.file_type === 'pdf' ? '#FA0F00' : '#1473E6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1B1B1B] truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StatusBadge status={doc.status} />
                      <Progress signed={Number(doc.signed_count)} total={Number(doc.recipient_count)} />
                    </div>
                    <p className="text-[10px] text-[#AAAAAA] mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <DownloadBtn doc={doc} />
                </div>
              ))}
            </div>

            {/* Desktop table (md+) */}
            <div className="hidden md:block bg-white border border-[#E8E8E8] overflow-hidden" style={{ borderRadius: '2px' }}>
              <div className="grid gap-4 px-5 py-2.5 border-b border-[#F0F0F0] bg-[#FAFAFA]"
                style={{ gridTemplateColumns: '1fr 110px 100px 110px 90px 36px' }}>
                {['Document', 'Expéditeur', 'Statut', 'Signatures', 'Date', ''].map((h, i) => (
                  <span key={i} className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider">{h}</span>
                ))}
              </div>

              {filtered.map((doc, i) => (
                <div
                  key={doc.id}
                  className="grid gap-4 px-5 py-3.5 items-center transition-colors hover:bg-[#F8F8F8]"
                  style={{
                    gridTemplateColumns: '1fr 110px 100px 110px 90px 36px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #F5F5F5' : 'none',
                  }}
                >
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
                  <DownloadBtn doc={doc} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
