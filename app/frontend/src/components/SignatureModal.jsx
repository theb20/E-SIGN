import { useState, useRef, useEffect } from 'react'

const FONTS = [
  { id: 'dancing', label: 'Style 1', family: "'Dancing Script', cursive" },
  { id: 'satisfy', label: 'Style 2', family: "'Satisfy', cursive" },
  { id: 'pacifico', label: 'Style 3', family: "'Pacifico', cursive" },
]

export default function AdoptModal({ field, onSave, onClose }) {
  const [tab, setTab] = useState('type')
  const [typedText, setTypedText] = useState('')
  const [fontId, setFontId] = useState('dancing')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const isDrawing = useRef(false)
  const ctx = useRef(null)

  useEffect(() => {
    if (tab !== 'draw' || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = canvas.parentElement.clientWidth || 440
    canvas.height = 140
    const c = canvas.getContext('2d')
    c.strokeStyle = '#1B1B1B'
    c.lineWidth = 2
    c.lineCap = 'round'
    c.lineJoin = 'round'
    ctx.current = c
  }, [tab])

  const getXY = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / rect.width
    const sy = canvasRef.current.height / rect.height
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy }
  }

  const onDown = (e) => {
    e.preventDefault()
    isDrawing.current = true
    const { x, y } = getXY(e)
    ctx.current.beginPath()
    ctx.current.moveTo(x, y)
  }
  const onMove = (e) => {
    e.preventDefault()
    if (!isDrawing.current) return
    setHasDrawn(true)
    const { x, y } = getXY(e)
    ctx.current.lineTo(x, y)
    ctx.current.stroke()
  }
  const onUp = () => { isDrawing.current = false }
  const clearCanvas = () => {
    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHasDrawn(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const canSave = tab === 'draw' ? hasDrawn : tab === 'upload' ? !!uploadedImage : typedText.trim().length > 0
  const selectedFont = FONTS.find(f => f.id === fontId)

  const handleAdopt = () => {
    if (!canSave) return
    let data
    if (tab === 'draw')   data = { type: 'draw',   image: canvasRef.current.toDataURL() }
    else if (tab === 'upload') data = { type: 'draw', image: uploadedImage }
    else                  data = { type: 'type', text: typedText, fontFamily: selectedFont.family }
    onSave(field.id, data)
  }

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-[460px] animate-slide-up max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-none"
        style={{ boxShadow: '0 -4px 32px rgba(0,0,0,0.35)' }}>

        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#DDDDDD]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-[#E8E8E8]">
          <div>
            <h2 className="text-[14px] font-bold text-[#1B1B1B]">
              {field.type === 'initials' ? 'Créez vos initiales' : 'Créez votre signature'}
            </h2>
            <p className="text-[11px] text-[#888] mt-0.5">{field.label}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#F5F5F5] rounded text-[#999] hover:text-[#333] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8E8E8]">
          {[{ id: 'type', label: 'Taper' }, { id: 'draw', label: 'Dessiner' }, { id: 'upload', label: 'Importer' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-[13px] font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[#1473E6] text-[#1473E6]'
                  : 'border-transparent text-[#666] hover:text-[#333] hover:bg-[#FAFAFA]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* TYPE TAB */}
          {tab === 'type' && (
            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1.5">
                Nom complet
              </label>
              <input
                type="text"
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
                placeholder="Entrez votre nom complet…"
                autoFocus
                className="w-full border border-[#CCCCCC] px-3 py-2 text-[13px] text-[#333] focus:outline-none focus:border-[#1473E6] transition-colors"
                style={{ borderRadius: '2px' }}
              />

              {/* Preview */}
              <div
                className="mt-3 border border-[#E0E0E0] bg-[#FAFAFA] h-[88px] flex items-center justify-center"
                style={{ borderBottom: '2px solid #333', borderRadius: '2px' }}
              >
                {typedText.trim() ? (
                  <span className="text-[#1B1B1B] text-[2rem] px-4" style={{ fontFamily: selectedFont.family }}>
                    {typedText}
                  </span>
                ) : (
                  <span className="text-[#CCCCCC] text-[13px]">Aperçu de votre signature</span>
                )}
              </div>

              {/* Font picker */}
              {typedText.trim() && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Choisir un style</p>
                  <div className="flex gap-2">
                    {FONTS.map(font => (
                      <button
                        key={font.id}
                        onClick={() => setFontId(font.id)}
                        className="flex-1 py-2 px-1.5 border text-center transition-all"
                        style={{
                          borderRadius: '2px',
                          border: fontId === font.id ? '2px solid #1473E6' : '1px solid #DDDDDD',
                          background: fontId === font.id ? '#F0F7FF' : 'white',
                        }}
                      >
                        <p className="text-[9px] text-[#999] mb-1">{font.label}</p>
                        <p style={{ fontFamily: font.family, fontSize: '1rem', color: '#1B1B1B', lineHeight: 1.2 }}>
                          {typedText.split(' ')[0]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD TAB */}
          {tab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/svg+xml"
                className="hidden"
                onChange={handleFileUpload}
              />
              {uploadedImage ? (
                <div>
                  <div className="border border-[#E0E0E0] bg-[#FAFAFA] h-[140px] flex items-center justify-center overflow-hidden" style={{ borderRadius: '2px' }}>
                    <img src={uploadedImage} alt="Signature" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button
                    onClick={() => { setUploadedImage(null); fileInputRef.current.value = '' }}
                    className="mt-2 text-[11px] text-[#888] hover:text-[#1473E6] transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Changer l'image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-full border-2 border-dashed border-[#DDDDDD] bg-[#FAFAFA] h-[140px] flex flex-col items-center justify-center gap-2 hover:border-[#1473E6] hover:bg-[#F0F7FF] transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  <svg className="w-8 h-8 text-[#CCCCCC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[12px] text-[#888]">Cliquez pour choisir une image</p>
                  <p className="text-[10px] text-[#AAAAAA]">PNG, JPG, GIF, SVG</p>
                </button>
              )}
            </div>
          )}

          {/* DRAW TAB */}
          {tab === 'draw' && (
            <div>
              <div
                className="border border-[#E0E0E0] bg-[#FAFAFA] relative overflow-hidden"
                style={{ borderBottom: '2px solid #333', borderRadius: '2px' }}
              >
                <canvas
                  ref={canvasRef}
                  className="block w-full cursor-crosshair touch-none"
                  style={{ height: '140px' }}
                  onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
                  onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <svg className="w-6 h-6 text-[#CCCCCC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <p className="text-[#CCCCCC] text-[12px]">Dessinez votre signature</p>
                  </div>
                )}
              </div>
              {hasDrawn && (
                <button
                  onClick={clearCanvas}
                  className="mt-2 text-[11px] text-[#888] hover:text-[#1473E6] transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Effacer et recommencer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legal disclaimer */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-[#AAAAAA] leading-[1.6] border-t border-[#F0F0F0] pt-3">
            En cliquant sur <strong className="text-[#888]">Adopter et signer</strong>, vous acceptez que cette
            représentation électronique constitue votre signature légalement contraignante, conformément
            au règlement eIDAS (UE) n° 910/2014.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#1473E6] font-medium hover:bg-[#F0F7FF] rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAdopt}
            disabled={!canSave}
            className="px-6 py-2 text-white text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canSave ? '#1473E6' : '#AAAAAA',
              borderRadius: '2px',
            }}
          >
            Adopter et signer
          </button>
        </div>
      </div>
    </div>
  )
}
