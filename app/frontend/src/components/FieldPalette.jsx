import { FIELD_COLORS } from '../App'

export const SIGNER_COLORS = ['#1473E6', '#7B4FFF', '#E87722', '#2DA44E', '#CC0000', '#0891B2']

const TYPES = [
  {
    type: 'signature', label: 'Signature',
    d: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
  {
    type: 'initials', label: 'Initiales',
    d: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
  },
  {
    type: 'text', label: 'Zone de texte',
    d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    type: 'date', label: 'Date',
    d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    type: 'checkbox', label: 'Case à cocher',
    d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    type: 'dropdown', label: 'Liste déroulante',
    d: 'M8 9l4-4 4 4m0 6l-4 4-4-4',
  },
]

export default function FieldPalette({ mode, fields, signatures, placingType, nextUnsignedId, onSelectType, onFieldClick, activeSigner, signerCount, onSetActiveSigner, onAddSigner }) {
  if (mode === 'place') {
    const activeColor = SIGNER_COLORS[activeSigner % SIGNER_COLORS.length]
    return (
      <aside className="w-[188px] bg-white border-r border-[#E0E0E0] flex flex-col shrink-0 hidden md:flex">

        {/* Signer selector */}
        <div className="px-3 pt-3 pb-2 border-b border-[#EBEBEB]">
          <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Signataires</p>
          <div className="space-y-1">
            {Array.from({ length: signerCount }).map((_, i) => {
              const c = SIGNER_COLORS[i % SIGNER_COLORS.length]
              const isActive = activeSigner === i
              const count = fields.filter(f => (f.signerIndex ?? 0) === i).length
              return (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onSetActiveSigner(i) }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-all"
                  style={{
                    border: isActive ? `1.5px solid ${c}` : '1px solid #E5E5E5',
                    background: isActive ? `${c}12` : 'white',
                    borderRadius: '2px',
                  }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: c }}>
                    {i + 1}
                  </div>
                  <span className="text-[11px] font-medium flex-1" style={{ color: isActive ? c : '#555' }}>
                    Signataire {i + 1}
                  </span>
                  {count > 0 && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: `${c}22`, color: c }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {signerCount < 6 && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddSigner() }}
              className="w-full mt-1.5 text-[11px] text-[#1473E6] hover:underline text-left px-1"
            >
              + Ajouter un signataire
            </button>
          )}
        </div>

        <div className="px-3 pt-2 pb-1">
          <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Champs</p>
          <p className="text-[10px] text-[#BBBBBB] mt-0.5">Pour Signataire {activeSigner + 1}</p>
        </div>

        <div className="px-3 pb-2 space-y-1.5 flex-1 overflow-y-auto">
          {TYPES.map(({ type, label, d }) => {
            const color = FIELD_COLORS[type]
            const active = placingType === type
            return (
              <button
                key={type}
                onClick={(e) => { e.stopPropagation(); onSelectType(active ? null : type) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all"
                style={{
                  border: active ? `2px solid ${activeColor}` : '1px solid #E5E5E5',
                  background: active ? `${activeColor}14` : 'white',
                  borderRadius: '2px',
                }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: active ? activeColor : color }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
                </svg>
                <span className="text-[12px] font-medium" style={{ color: active ? activeColor : '#444' }}>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: activeColor }} />
                )}
              </button>
            )
          })}
        </div>

        <div className="p-3 border-t border-[#EBEBEB] bg-[#FAFAFA]">
          <p className="text-[10px] text-[#AAAAAA] leading-relaxed">
            {placingType
              ? `Cliquez sur le document pour placer`
              : fields.length === 0
              ? 'Sélectionnez un type de champ'
              : `${fields.length} champ${fields.length > 1 ? 's' : ''} placé${fields.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </aside>
    )
  }

  /* ── sign mode: field list ─────────────────────────────── */
  return (
    <aside className="w-[188px] bg-white border-r border-[#E0E0E0] flex flex-col shrink-0 hidden md:flex">
      <div className="px-4 py-3 border-b border-[#EBEBEB]">
        <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Champs à remplir</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {fields.length === 0 && (
          <p className="text-[11px] text-[#CCCCCC] text-center py-6">Aucun champ</p>
        )}
        {fields.map((field, i) => {
          const signed = !!signatures[field.id]
          const isNext = field.id === nextUnsignedId
          const color = FIELD_COLORS[field.type]
          return (
            <button
              key={field.id}
              onClick={() => onFieldClick(field.id)}
              className="w-full flex items-center gap-2 p-2.5 text-left transition-all"
              style={{
                border: signed ? '1px solid #A5D6A7' : isNext ? `1.5px solid ${color}` : '1px solid #E5E5E5',
                background: signed ? '#F1FBF4' : isNext ? `${color}10` : 'white',
                borderRadius: '2px',
              }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                style={{ background: signed ? '#2DA44E' : isNext ? color : '#DDDDDD' }}>
                {signed ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate"
                  style={{ color: signed ? '#2E7D32' : isNext ? color : '#555' }}>
                  {field.label}
                </p>
                <p className="text-[10px] text-[#AAAAAA] capitalize">{field.type}</p>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
