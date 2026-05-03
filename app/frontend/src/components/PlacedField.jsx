import { useRef, useEffect } from 'react'
import { FIELD_COLORS } from '../App'
import { SIGNER_COLORS } from './FieldPalette'

const TAG = { signature: 'SIGNATURE', initials: 'INITIALES', text: 'TEXTE', date: 'DATE', checkbox: '☐', dropdown: 'LISTE' }

export default function PlacedField({
  field, isSelected, signature, mode,
  isEditing, onSelect, onMove, onResize, onCommitText, onCancelEdit, onCommitDropdown,
}) {
  const color   = FIELD_COLORS[field.type]
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  /* ── drag-to-move (place mode) ──────────────────────────── */
  const startMove = (e) => {
    if (mode !== 'place') return
    e.stopPropagation()
    onSelect(e)
    const sx = e.clientX, sy = e.clientY
    const fx = field.x,   fy = field.y
    const move = (e) => onMove(Math.max(0, fx + e.clientX - sx), Math.max(0, fy + e.clientY - sy))
    const up   = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  /* ── drag-to-resize ─────────────────────────────────────── */
  const startResize = (e) => {
    e.stopPropagation(); e.preventDefault()
    const sx = e.clientX, sy = e.clientY
    const sw = field.width, sh = field.height
    const move = (e) => onResize(sw + e.clientX - sx, sh + e.clientY - sy)
    const up   = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const base = {
    position: 'absolute',
    left: field.x, top: field.y,
    width: field.width, height: field.height,
    borderRadius: '2px',
    userSelect: 'none',
    overflow: 'hidden',
  }

  /* ── signed (sign mode) ─────────────────────────────────── */
  if (signature && mode === 'sign') {
    return (
      <div id={`f-${field.id}`}
        style={{ ...base, border: 'none', background: 'transparent', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onSelect(e) }}>

        {field.type === 'checkbox' ? (
          /* Checkmark only, no box */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0B3D8F" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ width: '70%', height: '70%' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

        ) : signature.type === 'draw' ? (
          /* Drawn signature: image only, no frame */
          <img src={signature.image} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

        ) : signature.type === 'type' ? (
          /* Typed signature: text + subtle underline */
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
            <span style={{
              fontFamily: signature.fontFamily ?? 'cursive',
              fontSize: field.type === 'initials' ? '1.1rem' : '1.5rem',
              color: '#0B2C6B', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              {signature.text}
            </span>
            <div style={{ position: 'absolute', bottom: 1, left: 4, right: 4, height: 1, background: '#BBBBBB' }} />
          </div>

        ) : (
          /* text / date */
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 4px' }}>
            <span style={{ fontSize: 12, color: '#1B1B1B', lineHeight: 1.3 }}>{signature.text}</span>
          </div>
        )}
      </div>
    )
  }

  /* ── dropdown (sign mode) ───────────────────────────────── */
  if (isEditing && field.type === 'dropdown') {
    const options = field.options ?? []
    return (
      <div id={`f-${field.id}`}
        style={{ ...base, border: 'none', background: 'transparent', zIndex: 20 }}
        onClick={(e) => e.stopPropagation()}>
        <select
          autoFocus
          defaultValue=""
          onChange={(e) => { if (e.target.value) onCommitText(field.id, e.target.value) }}
          onBlur={(e) => { if (!e.target.value) onCancelEdit() }}
          style={{
            width: '100%', height: '100%', border: '1px solid #1473E6', outline: 'none',
            padding: '0 4px', fontSize: '12px', color: '#1B1B1B',
            background: 'white', cursor: 'pointer', borderRadius: '2px',
          }}
        >
          <option value="" disabled>Choisir…</option>
          {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      </div>
    )
  }

  /* ── inline text/date editor (sign mode) ────────────────── */
  if (isEditing && (field.type === 'text' || field.type === 'date')) {
    return (
      <div id={`f-${field.id}`}
        style={{ ...base, border: 'none', background: 'transparent', zIndex: 20, borderBottom: '1.5px solid #BBBBBB' }}
        onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type={field.type === 'date' ? 'date' : 'text'}
          placeholder={field.label}
          onBlur={(e) => onCommitText(field.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitText(field.id, e.target.value)
            if (e.key === 'Escape') onCancelEdit()
          }}
          style={{
            width: '100%', height: '100%', border: 'none', outline: 'none',
            padding: '0 4px', fontSize: '12px', color: '#1B1B1B',
            background: 'transparent',
          }}
        />
      </div>
    )
  }

  /* ── unsigned field (place mode) ───────────────────────── */
  if (mode === 'place') {
    const signerIndex = field.signerIndex ?? (field.options?.signerIndex ?? 0)
    const signerColor = SIGNER_COLORS[signerIndex % SIGNER_COLORS.length]
    return (
      <div
        id={`f-${field.id}`}
        onMouseDown={startMove}
        onClick={(e) => { e.stopPropagation(); onSelect(e) }}
        style={{
          ...base,
          border: isSelected ? `2px solid ${signerColor}` : `1.5px dashed ${signerColor}99`,
          background: isSelected ? `${signerColor}14` : `${signerColor}09`,
          cursor: 'move',
          boxShadow: isSelected ? `0 0 0 3px ${signerColor}22` : 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, padding: '1px 5px', fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', color: 'white', background: signerColor, lineHeight: 1.7, textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{TAG[field.type]}</span>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: '0 0 0 6px', background: signerColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: 'white', lineHeight: 1 }}>{signerIndex + 1}</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 14 }}>
          <span style={{ fontSize: 11, color: `${signerColor}BB`, fontWeight: 500, textAlign: 'center', padding: '0 4px' }}>
            {field.label}
          </span>
        </div>
        {isSelected && (
          <div onMouseDown={startResize} style={{ position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, background: signerColor, borderRadius: '50%', cursor: 'se-resize', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
        )}
      </div>
    )
  }

  /* ── unsigned field (sign mode) — minimal, juste un trait ── */
  if (field.type === 'checkbox') {
    return (
      <div id={`f-${field.id}`}
        onClick={(e) => { e.stopPropagation(); onSelect(e) }}
        style={{ ...base, border: '1.5px solid #CCCCCC', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" style={{ width: '60%', height: '60%' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </div>
    )
  }

  return (
    <div id={`f-${field.id}`}
      onClick={(e) => { e.stopPropagation(); onSelect(e) }}
      style={{ ...base, border: 'none', borderBottom: `1.5px solid ${color}55`, background: 'transparent', cursor: 'pointer' }}>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 4px', fontSize: 11, color: `${color}88`, fontWeight: 500 }}>
        {field.type === 'signature' || field.type === 'initials' ? 'Cliquer pour signer' : field.label}
      </span>
    </div>
  )
}
