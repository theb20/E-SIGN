import { FIELDS, DOC_INFO } from '../App'

export default function RightPanel({ signatures, nextField, allSigned, onGoToNext, onFieldClick, onComplete }) {
  const signedCount = Object.keys(signatures).length

  return (
    <aside className="w-[272px] flex flex-col border-l border-[#D8D8D8] bg-white shrink-0 hidden md:flex">

      {/* CTA — next field */}
      <div className="p-3 border-b border-[#EBEBEB]" style={{ background: allSigned ? '#F0FAF4' : '#F0F7FF' }}>
        {allSigned ? (
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded text-white text-[13px] font-semibold transition-all hover:brightness-105 active:brightness-95"
            style={{ background: '#1473E6' }}
          >
            <span>Finaliser le document</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onGoToNext}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded text-white text-[13px] font-semibold transition-all hover:brightness-105 active:brightness-95"
            style={{ background: '#1473E6' }}
          >
            <span>Aller au champ suivant</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <p className="text-center text-[11px] mt-2" style={{ color: allSigned ? '#2DA44E' : '#1473E6' }}>
          {allSigned
            ? '✓ Tous les champs sont complétés'
            : `${FIELDS.length - signedCount} champ${FIELDS.length - signedCount > 1 ? 's' : ''} restant${FIELDS.length - signedCount > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Recipient */}
      <div className="px-4 py-3 border-b border-[#EBEBEB]">
        <p className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-[0.12em] mb-2">Vous signez en tant que</p>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#7B4FFF] flex items-center justify-center text-white text-xs font-bold shrink-0">
            V
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1B1B1B] leading-tight">Vous</p>
            <p className="text-[11px] text-[#888]">Client · Destinataire</p>
          </div>
          <div>
            {allSigned ? (
              <span className="text-[10px] px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded-full font-semibold">
                Complété
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-[#FFF3E0] text-[#BF5500] rounded-full font-semibold">
                {signedCount}/{FIELDS.length}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(signedCount / FIELDS.length) * 100}%`,
              background: allSigned ? '#2DA44E' : '#1473E6',
            }}
          />
        </div>
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-[0.12em] mb-3">Champs à remplir</p>
        <div className="space-y-2">
          {FIELDS.map((field, i) => {
            const signed = !!signatures[field.id]
            const isNext = nextField?.id === field.id
            const isLocked = !signed && i > 0 && !signatures[FIELDS[i - 1].id]

            return (
              <button
                key={field.id}
                onClick={() => !isLocked && onFieldClick(field.id)}
                disabled={isLocked}
                className={`w-full text-left p-3 rounded border transition-all ${
                  signed
                    ? 'border-[#A5D6A7] bg-[#F1FBF4]'
                    : isNext
                    ? 'border-[#1473E6] bg-[#F0F7FF]'
                    : isLocked
                    ? 'border-[#EEEEEE] bg-[#FAFAFA] opacity-50 cursor-not-allowed'
                    : 'border-[#DDDDDD] bg-white hover:border-[#1473E6] hover:bg-[#F8FBFF]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: signed ? '#2DA44E' : isNext ? '#1473E6' : '#DDDDDD',
                      color: 'white',
                    }}
                  >
                    {signed ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-semibold truncate leading-tight"
                      style={{ color: signed ? '#2E7D32' : isNext ? '#1473E6' : '#555' }}
                    >
                      {field.label}
                    </p>
                    <p className="text-[10px] text-[#AAAAAA] truncate mt-0.5">{field.hint}</p>
                  </div>
                  {isNext && !signed && (
                    <svg className="w-4 h-4 text-[#1473E6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {isLocked && (
                    <svg className="w-3.5 h-3.5 text-[#CCCCCC] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Other signers */}
        <div className="mt-5">
          <p className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-[0.12em] mb-3">Autre signataire</p>
          <div className="flex items-center gap-2.5 p-3 rounded border border-[#A5D6A7] bg-[#F1FBF4]">
            <div className="w-6 h-6 rounded-full bg-[#1976D2] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              TS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#2E7D32] truncate">{DOC_INFO.sender.name}</p>
              <p className="text-[10px] text-[#888]">Signé le {DOC_INFO.sender.signedAt}</p>
            </div>
            <svg className="w-4 h-4 text-[#2DA44E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-[#EBEBEB] bg-[#FAFAFA]">
        <div className="flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-[#AAAAAA] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-[10px] text-[#BBBBBB] leading-relaxed">
            Signature électronique sécurisée conforme au règlement eIDAS
          </p>
        </div>
      </div>
    </aside>
  )
}
