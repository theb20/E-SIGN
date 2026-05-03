export default function SignatureField({ field, signature, onClick, isNext, compact = false }) {
  const h = compact ? 40 : 56
  const tagLabel = field.type === 'initials' ? 'INITIALES' : 'SIGNATURE'

  if (signature) {
    return (
      <button
        onClick={onClick}
        className="relative group overflow-hidden rounded transition-all"
        style={{
          width: compact ? 100 : '100%',
          height: h,
          border: '1.5px solid #2DA44E',
          background: 'rgba(45,164,78,0.06)',
        }}
        title="Cliquer pour modifier"
      >
        <div
          className="absolute top-0 left-0 px-1.5 py-[2px] text-[8px] font-bold uppercase tracking-wider text-white leading-none"
          style={{ background: '#2DA44E' }}
        >
          {tagLabel}
        </div>
        <div className="absolute inset-0 flex items-center justify-center mt-2 px-2">
          {signature.type === 'draw' ? (
            <img src={signature.image} alt="Signature" className="max-w-full max-h-full object-contain" />
          ) : (
            <span style={{ fontFamily: signature.fontFamily, fontSize: compact ? '1rem' : '1.5rem', color: '#1B1B1B' }}>
              {signature.text}
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-[#2DA44E]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1">
          <span className="text-[9px] font-bold text-white bg-[#2DA44E] px-1.5 py-0.5 rounded">Modifier</span>
        </div>
      </button>
    )
  }

  return (
    <button
      id={`field-${field.id}`}
      onClick={onClick}
      className="relative group rounded transition-all"
      style={{
        width: compact ? 100 : '100%',
        height: h,
        border: isNext ? '1.5px solid #1473E6' : '1.5px dashed #BBBBBB',
        background: isNext ? 'rgba(20,115,230,0.07)' : 'rgba(0,0,0,0.02)',
      }}
    >
      {/* Field type tag */}
      <div
        className="absolute top-0 left-0 px-1.5 py-[2px] text-[8px] font-bold uppercase tracking-wider text-white leading-none"
        style={{ background: isNext ? '#1473E6' : '#BBBBBB' }}
      >
        {tagLabel}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center gap-1.5 mt-2">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: isNext ? '#1473E6' : '#BBBBBB' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span className="text-[11px] font-medium" style={{ color: isNext ? '#1473E6' : '#BBBBBB' }}>
          {compact ? 'Signer' : 'Cliquer pour signer'}
        </span>
      </div>

      {isNext && (
        <div className="absolute inset-0 bg-[#1473E6]/8 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
      )}
    </button>
  )
}
