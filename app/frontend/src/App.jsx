import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadScreen from './components/UploadScreen'
import Header from './components/Header'
import FieldPalette from './components/FieldPalette'
import DocumentCanvas from './components/DocumentCanvas'
import PropertiesPanel from './components/PropertiesPanel'
import SignatureModal from './components/SignatureModal'
import SendScreen from './components/SendScreen'
import { createDocument, saveFields as apiSaveFields, listTemplates, createTemplate, deleteTemplate } from './api.js'
import './index.css'

export const FIELD_COLORS = {
  signature: '#1473E6',
  initials:  '#7B4FFF',
  text:      '#2DA44E',
  date:      '#E87722',
  checkbox:  '#CC0000',
  dropdown:  '#0891B2',
}

export const FIELD_DEFAULTS = {
  signature: { width: 180, height: 64,  label: 'Signature' },
  initials:  { width: 100, height: 48,  label: 'Initiales' },
  text:      { width: 200, height: 36,  label: 'Texte' },
  date:      { width: 150, height: 36,  label: 'Date' },
  checkbox:  { width: 28,  height: 28,  label: 'Case à cocher' },
  dropdown:  { width: 180, height: 36,  label: 'Liste déroulante', options: ['Option 1', 'Option 2', 'Option 3'] },
}

let nextId = 1
function uid() { return `f${nextId++}` }

export default function App() {
  const navigate = useNavigate()
  const [mode, setMode]           = useState('upload')
  const [doc, setDoc]             = useState(null)    // { file, url, type, name }
  const [docId, setDocId]         = useState(null)    // backend document ID
  const [fields, setFields]       = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [placingType, setPlacingType] = useState(null)
  const [signingId, setSigningId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [signatures, setSignatures] = useState({})
  const [sending, setSending]     = useState(false)
  const [sendError, setSendError] = useState(null)
  const [signerCount, setSignerCount]   = useState(1)
  const [activeSigner, setActiveSigner] = useState(0)
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    listTemplates().then(d => setTemplates(d.templates)).catch(() => {})
  }, [])

  /* ── upload & create document on backend ───────────────── */
  const handleUpload = useCallback(async (file) => {
    const url  = URL.createObjectURL(file)
    const type = file.type === 'application/pdf' ? 'pdf' : 'image'
    setDoc({ file, url, type, name: file.name })
    setMode('place')
    setSendError(null)
    // create doc on backend
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await createDocument(fd)
      setDocId(res.id)
    } catch (err) {
      console.error('Création document:', err.message)
    }
  }, [])

  /* ── field placement ───────────────────────────────────── */
  const placeField = useCallback((type, x, y, page = 1) => {
    const def = FIELD_DEFAULTS[type]
    const field = {
      id: uid(), type,
      x: x - def.width / 2,  y: y - def.height / 2,
      width: def.width, height: def.height,
      label: def.label, required: true, page,
      options: def.options ?? null,
      signerIndex: activeSigner,
    }
    setFields(p => [...p, field])
    setSelectedId(field.id)
    setPlacingType(null)
  }, [activeSigner])

  const moveField   = useCallback((id, x, y) => setFields(p => p.map(f => f.id === id ? { ...f, x, y }         : f)), [])
  const resizeField = useCallback((id, w, h) => setFields(p => p.map(f => f.id === id ? { ...f, width: Math.max(40, w), height: Math.max(24, h) } : f)), [])
  const updateField = useCallback((id, up)   => setFields(p => p.map(f => f.id === id ? { ...f, ...up }        : f)), [])
  const deleteField = useCallback((id) => { setFields(p => p.filter(f => f.id !== id)); setSelectedId(null) }, [])

  /* ── signing (local preview) ───────────────────────────── */
  const handleFieldClick = useCallback((id) => {
    const field = fields.find(f => f.id === id)
    if (!field) return
    if (field.type === 'signature' || field.type === 'initials') setSigningId(id)
    else if (field.type === 'checkbox') setSignatures(p => ({ ...p, [id]: p[id] ? null : { type: 'checkbox', checked: true } }))
    else setEditingId(id)
  }, [fields])

  const saveSignature = useCallback((id, data) => {
    setSignatures(p => ({ ...p, [id]: data }))
    setSigningId(null)
  }, [])

  const commitText = useCallback((id, text) => {
    if (text.trim()) setSignatures(p => ({ ...p, [id]: { type: 'text', text } }))
    setEditingId(null)
  }, [])

  /* ── save as template ──────────────────────────────────── */
  const handleSaveTemplate = useCallback(async () => {
    const name = window.prompt('Nom du modèle :')
    if (!name?.trim()) return
    try {
      await createTemplate({ name: name.trim(), fields })
      const d = await listTemplates()
      setTemplates(d.templates)
    } catch (err) {
      alert(err.message)
    }
  }, [fields])

  const handleLoadTemplate = useCallback((templateId) => {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    setFields(tpl.fields.map(f => ({ ...f, id: uid() })))
  }, [templates])

  /* ── switch to send screen (save fields first) ─────────── */
  const handleSend = useCallback(async () => {
    setSendError(null)
    setSending(true)
    try {
      if (docId) await apiSaveFields(docId, fields)
      setMode('send')
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }, [docId, fields])

  /* ── derived ───────────────────────────────────────────── */
  const required     = fields.filter(f => f.required)
  const allSigned    = required.length > 0 && required.every(f => signatures[f.id])
  const nextUnsigned = required.find(f => !signatures[f.id])
  const signingField = fields.find(f => f.id === signingId) ?? null

  const goToNext = () => {
    if (nextUnsigned) document.getElementById(`f-${nextUnsigned.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /* ── screens ────────────────────────────────────────────── */
  if (mode === 'upload') return <UploadScreen onUpload={handleUpload} />

  if (mode === 'send') return (
    <SendScreen
      documentId={docId}
      signerCount={signerCount}
      onBack={() => setMode('place')}
      onSent={() => navigate(`/documents/${docId}`)}
    />
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#2B2B2B]"
      onClick={() => { if (mode === 'place' && !placingType) setSelectedId(null) }}>

      <Header
        doc={doc} mode={mode}
        fieldCount={fields.length}
        onToggleMode={() => { setMode(m => m === 'place' ? 'sign' : 'place'); setSelectedId(null); setPlacingType(null) }}
        onSend={handleSend}
        sending={sending}
      />

      <div className="flex flex-1 overflow-hidden">
        <FieldPalette
          mode={mode} fields={fields} signatures={signatures}
          placingType={placingType} nextUnsignedId={nextUnsigned?.id}
          onSelectType={setPlacingType}
          onFieldClick={mode === 'sign' ? handleFieldClick : setSelectedId}
          activeSigner={activeSigner} signerCount={signerCount}
          onSetActiveSigner={setActiveSigner}
          onAddSigner={() => { setSignerCount(c => c + 1); setActiveSigner(signerCount) }}
        />

        <DocumentCanvas
          doc={doc} fields={fields}
          selectedId={mode === 'place' ? selectedId : null}
          editingId={editingId}
          placingType={placingType} signatures={signatures} mode={mode}
          onPlaceField={placeField}
          onSelectField={setSelectedId}
          onMoveField={moveField}
          onResizeField={resizeField}
          onFieldClick={handleFieldClick}
          onCommitText={commitText}
          onCancelEdit={() => setEditingId(null)}
        />

        <PropertiesPanel
          mode={mode}
          selectedField={fields.find(f => f.id === selectedId) ?? null}
          fields={fields} signatures={signatures}
          nextUnsigned={nextUnsigned} allSigned={allSigned}
          onUpdate={updateField} onDelete={deleteField}
          onGoToNext={goToNext}
          onSignField={handleFieldClick}
          onComplete={handleSend}
          onSend={handleSend}
          sending={sending}
          templates={templates}
          onSaveTemplate={handleSaveTemplate}
          onLoadTemplate={handleLoadTemplate}
        />
      </div>

      {signingField && (
        <SignatureModal field={signingField} onSave={saveSignature} onClose={() => setSigningId(null)} />
      )}
    </div>
  )
}
