import { useRef, useEffect } from 'react'
import { FIELD_COLORS } from '../App'
import { SIGNER_COLORS } from './FieldPalette'

const TAG = { signature: 'SIGNATURE', initials: 'INITIALES', text: 'TEXTE', date: 'DATE', checkbox: '☐', dropdown: 'LISTE' }

export default function PlacedField({
  field, isSelected, signature, mode, scale = 1,
  isEditing, onSelect, onMove, onResize, onCommitText, onCancelEdit, onCommitDropdown,
}) {
  const color    = FIELD_COLORS[field.type]
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  /* Scaled coordinates — field coords stored in 794px space */
  const sx = field.x      * scale
  const sy = field.y      * scale
  const sw = field.width  * scale
  const sh = field.height * scale

  /* ── drag-to-move (place mode) ──────────────────────────── */
  const startMove = (e) => {
    if (mode !== 'place') return
    e.stopPropagation()
    onSelect(e)
    const ex = e.clientX, ey = e.clientY
    const fx = field.x,   fy = field.y
    // divide screen delta by scale to keep coords in 794px space
    const move = (e) => onMove(
      Math.max(0, fx + (e.clientX - ex) / scale),
      Math.max(0, fy + (e.clientY - ey) / scale),
    )
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  /* ── drag-to-resize ─────────────────────────────────────── */
  const startResize = (e) => {
    e.stopPropagation(); e.preventDefault()
    const ex = e.clientX, ey = e.clientY
    const fw = field.width, fh = field.height
    const move = (e) => onResize(
      fw + (e.clientX - ex) / scale,
      fh + (e.clientY - ey) / scale,
    )
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const base = {
    position: 'absolute',
    left: sx, top: sy, width: sw, height: sh,
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0B3D8F" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ width: '70%', height: '70%' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

        ) : signature.type === 'draw' ? (
          <img src={signature.image} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

        ) : signature.type === 'type' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
            <span style={{
              fontFamily: signature.fontFamily ?? 'cursive',
              fontSize: Math.max(10, Math.min(sh * 0.55, 28)),
              color: '#0B2C6B', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              {signature.text}
            </span>
            <div style={{ position: 'absolute', bottom: 1, left: 4, right: 4, height: 1, background: '#BBBBBB' }} />
          </div>

        ) : (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 4px' }}>
            <span style={{ fontSize: Math.max(9, sh * 0.42), color: '#1B1B1B', lineHeight: 1.3 }}>{signature.text}</span>
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
            padding: '0 4px', fontSize: Math.max(10, sh * 0.42), color: '#1B1B1B',
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
            padding: '0 4px', fontSize: Math.max(10, sh * 0.42), color: '#1B1B1B',
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
    const fontSize = Math.max(7, Math.min(sh * 0.35, 11))
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
        <div style={{ position: 'absolute', top: 0, left: 0, padding: '1px 4px', fontSize: Math.max(6, fontSize * 0.7), fontWeight: 700, letterSpacing: '0.06em', color: 'white', background: signerColor, lineHeight: 1.6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {TAG[field.type]}
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: Math.max(10, sw * 0.18), height: Math.max(10, sw * 0.18), borderRadius: '0 0 0 6px', background: signerColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: Math.max(6, sw * 0.1), fontWeight: 800, color: 'white', lineHeight: 1 }}>{signerIndex + 1}</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: Math.max(10, sh * 0.3) }}>
          <span style={{ fontSize, color: `${signerColor}BB`, fontWeight: 500, textAlign: 'center', padding: '0 4px' }}>
            {field.label}
          </span>
        </div>
        {isSelected && (
          <div onMouseDown={startResize} style={{ position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, background: signerColor, borderRadius: '50%', cursor: 'se-resize', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
        )}
      </div>
    )
  }

  /* ── unsigned field (sign mode) ───────────────────────────── */
  if (field.type === 'checkbox') {
    return (
      <div id={`f-${field.id}`}
        onClick={(e) => { e.stopPropagation(); onSelect(e) }}
        style={{ ...base, border: `1.5px solid ${color}66`, background: `${color}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" style={{ width: '55%', height: '55%', opacity: 0.5 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </div>
    )
  }

  const isSignature = field.type === 'signature' || field.type === 'initials'
  const labelFontSize = Math.max(9, Math.min(sh * 0.38, 12))

  return (
    <div id={`f-${field.id}`}
      onClick={(e) => { e.stopPropagation(); onSelect(e) }}
      style={{
        ...base,
        border: `1px solid ${color}55`,
        borderBottom: `2px solid ${color}`,
        background: `${color}08`,
        cursor: 'pointer',
      }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0 4px' }}>
        {isSignature && (
          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: Math.max(10, sh * 0.45), height: Math.max(10, sh * 0.45), opacity: 0.7, flexShrink: 0 }}>
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )}
        <span style={{ fontSize: labelFontSize, color, fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isSignature ? (field.type === 'initials' ? 'Initiales' : 'Signer') : field.label}
        </span>
      </div>
    </div>
  )
}
