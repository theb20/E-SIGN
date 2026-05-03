export default function Header({ doc, mode, fieldCount, onToggleMode, onSend, sending = false }) {
  return (
    <div className="h-11 flex items-center px-3 gap-2 shrink-0 border-b border-black/40 bg-[#2B2B2B]">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FA0F00]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 20 20">
            <path d="M3 3h9l5 5v9H3V3z" fill="white" opacity="0.95" />
            <path d="M12 3v6h5" stroke="rgba(200,0,0,0.5)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <span className="text-[#EBEBEB] text-xs font-semibold tracking-widest hidden sm:block">E·SIGN</span>
      </div>

      <div className="w-px h-5 bg-white/15 shrink-0" />

      {/* Filename */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-[#C0C0C0] text-xs truncate">{doc?.name ?? 'Sans titre'}</span>
        {mode === 'place' && (
          <span className="shrink-0 text-[#555] text-xs hidden sm:block">
            · {fieldCount} champ{fieldCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Mode toggle pill */}
      <div className="flex items-center shrink-0 bg-[#1A1A1A] rounded p-0.5 gap-0.5">
        {[
          { id: 'place', label: 'Éditer',  icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
          { id: 'sign',  label: 'Aperçu',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={onToggleMode}
            className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition-all"
            style={{
              background: mode === tab.id ? '#3D3D3D' : 'transparent',
              color:      mode === tab.id ? '#EBEBEB' : '#777',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
            </svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-white/15 shrink-0" />

      {/* Toolbar icons */}
      {[
        { d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", title: "Télécharger" },
        { d: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z", title: "Imprimer" },
      ].map(({ d, title }) => (
        <button key={title} title={title}
          className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-white/40 hover:text-white/70 transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
          </svg>
        </button>
      ))}

      {/* Send CTA — place mode */}
      {mode === 'place' && (
        <button
          onClick={onSend}
          disabled={sending || fieldCount === 0}
          className="shrink-0 flex items-center gap-1.5 h-7 px-3.5 text-white text-xs font-semibold transition-all rounded"
          style={{
            background: (sending || fieldCount === 0) ? '#444' : '#1473E6',
            cursor:     (sending || fieldCount === 0) ? 'not-allowed' : 'pointer',
            opacity:    fieldCount === 0 ? 0.5 : 1,
          }}
          title={fieldCount === 0 ? 'Ajoutez au moins un champ avant d\'envoyer' : ''}
        >
          {sending ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="hidden sm:inline">Envoi…</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Envoyer</span>
            </>
          )}
        </button>
      )}

      <div className="w-px h-5 bg-white/15 shrink-0" />
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-[#7B4FFF]">V</div>
    </div>
  )
}
