import { FIELD_COLORS } from '../App'

function SectionTitle({ children }) {
  return <p className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-[0.12em] mb-3">{children}</p>
}

export default function PropertiesPanel({
  mode, selectedField, fields, signatures,
  nextUnsigned, allSigned,
  onUpdate, onDelete, onGoToNext, onSignField, onComplete, onSend, sending,
  templates, onSaveTemplate, onLoadTemplate,
}) {
  /* ═══════════════ EDIT MODE ═══════════════ */
  if (mode === 'place') {
    return (
      <aside className="w-[224px] flex flex-col border-l border-[#D8D8D8] bg-white shrink-0 hidden lg:flex">
        {selectedField ? (
          <>
            <div className="px-4 py-3 border-b border-[#EBEBEB]">
              <SectionTitle>Propriétés du champ</SectionTitle>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: FIELD_COLORS[selectedField.type] }} />
                <span className="text-[12px] font-semibold text-[#333] capitalize">{selectedField.type}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Label */}
              <div>
                <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1.5">
                  Intitulé
                </label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={e => onUpdate(selectedField.id, { label: e.target.value })}
                  className="w-full border border-[#CCCCCC] px-2.5 py-1.5 text-[12px] text-[#333] focus:outline-none focus:border-[#1473E6] transition-colors"
                  style={{ borderRadius: '2px' }}
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1.5">
                  Dimensions (px)
                </label>
                <div className="flex gap-2">
                  {[['L', 'width', 40], ['H', 'height', 24]].map(([abbr, key, min]) => (
                    <div key={key} className="flex-1">
                      <span className="text-[9px] text-[#AAAAAA] block mb-0.5">{abbr}</span>
                      <input
                        type="number"
                        value={Math.round(selectedField[key])}
                        onChange={e => onUpdate(selectedField.id, { [key]: Math.max(min, parseInt(e.target.value) || min) })}
                        className="w-full border border-[#CCCCCC] px-2 py-1 text-[12px] text-[#333] focus:outline-none focus:border-[#1473E6] transition-colors"
                        style={{ borderRadius: '2px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1.5">
                  Position (px)
                </label>
                <div className="flex gap-2">
                  {[['X', 'x'], ['Y', 'y']].map(([abbr, key]) => (
                    <div key={key} className="flex-1">
                      <span className="text-[9px] text-[#AAAAAA] block mb-0.5">{abbr}</span>
                      <input
                        type="number"
                        value={Math.round(selectedField[key])}
                        onChange={e => onUpdate(selectedField.id, { [key]: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full border border-[#CCCCCC] px-2 py-1 text-[12px] text-[#333] focus:outline-none focus:border-[#1473E6] transition-colors"
                        style={{ borderRadius: '2px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dropdown options */}
              {selectedField.type === 'dropdown' && (
                <div>
                  <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1.5">Options</label>
                  {(selectedField.options ?? []).map((opt, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <input
                        type="text" value={opt}
                        onChange={e => {
                          const opts = [...(selectedField.options ?? [])]
                          opts[i] = e.target.value
                          onUpdate(selectedField.id, { options: opts })
                        }}
                        className="flex-1 border border-[#CCCCCC] px-2 py-1 text-[12px] focus:outline-none focus:border-[#1473E6]"
                        style={{ borderRadius: '2px' }}
                      />
                      <button
                        onClick={() => {
                          const opts = (selectedField.options ?? []).filter((_, j) => j !== i)
                          onUpdate(selectedField.id, { options: opts })
                        }}
                        className="w-6 h-6 flex items-center justify-center text-[#AAAAAA] hover:text-red-500 transition-colors"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => onUpdate(selectedField.id, { options: [...(selectedField.options ?? []), `Option ${(selectedField.options?.length ?? 0) + 1}`] })}
                    className="text-[11px] text-[#1473E6] hover:underline mt-1"
                  >+ Ajouter une option</button>
                </div>
              )}

              {/* Required toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedField.required}
                  onChange={e => onUpdate(selectedField.id, { required: e.target.checked })}
                  className="w-4 h-4 accent-[#1473E6] cursor-pointer"
                />
                <span className="text-[12px] text-[#555]">Champ requis</span>
              </label>

              {/* Preview */}
              <div>
                <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1.5">Aperçu</label>
                <div
                  className="flex items-center justify-center border-2 border-dashed"
                  style={{
                    height: Math.min(selectedField.height, 80),
                    borderColor: FIELD_COLORS[selectedField.type],
                    background: `${FIELD_COLORS[selectedField.type]}09`,
                    borderRadius: '2px',
                    color: FIELD_COLORS[selectedField.type],
                    fontSize: '11px', fontWeight: 500,
                  }}
                >
                  {selectedField.label}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#EBEBEB]">
              <button
                onClick={() => onDelete(selectedField.id)}
                className="w-full flex items-center justify-center gap-2 py-2 border text-[12px] font-medium transition-colors"
                style={{ border: '1px solid #FFAAAA', color: '#CC0000', background: 'white', borderRadius: '2px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#CCCCCC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              </div>
              <p className="text-[11px] text-[#CCCCCC] leading-relaxed">
                Sélectionnez un champ pour éditer ses propriétés
              </p>
            </div>
          </div>
        )}

        {/* Templates section */}
        {(templates?.length > 0 || onSaveTemplate) && (
          <div className="px-4 py-3 border-t border-[#EBEBEB]">
            <p className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-2">Modèles</p>
            {onLoadTemplate && templates?.length > 0 && (
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) onLoadTemplate(e.target.value) }}
                className="w-full border border-[#DDDDDD] px-2 py-1.5 text-[12px] text-[#555] focus:outline-none focus:border-[#1473E6] mb-2"
                style={{ borderRadius: '2px' }}
              >
                <option value="" disabled>Charger un modèle…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            {onSaveTemplate && fields.length > 0 && (
              <button
                onClick={onSaveTemplate}
                className="w-full py-1.5 text-[11px] font-medium text-[#1473E6] border border-[#1473E6]/30 hover:bg-[#EEF5FF] transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Sauvegarder comme modèle
              </button>
            )}
          </div>
        )}

        {/* Send section at bottom of place mode */}
        <div className="p-4 border-t border-[#EBEBEB] bg-[#FAFAFA] shrink-0">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Prêt à envoyer ?</span>
              <span className="text-[10px] text-[#AAAAAA]">{fields.length} champ{fields.length !== 1 ? 's' : ''}</span>
            </div>
            {fields.length === 0 ? (
              <p className="text-[11px] text-[#BBBBBB]">Ajoutez des champs sur le document avant d'envoyer.</p>
            ) : (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(
                  fields.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc }, {})
                ).map(([type, count]) => (
                  <span key={type} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                    style={{ background: `${FIELD_COLORS[type]}18`, color: FIELD_COLORS[type] }}>
                    {count} {type}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onSend}
            disabled={sending || fields.length === 0}
            className="w-full flex items-center justify-center gap-2 h-9 text-white text-[12px] font-semibold transition-all"
            style={{
              background:   (sending || fields.length === 0) ? '#CCCCCC' : '#1473E6',
              borderRadius: '2px',
              cursor:       (sending || fields.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {sending ? 'Sauvegarde…' : 'Envoyer pour signature'}
          </button>
        </div>
      </aside>
    )
  }

  /* ═══════════════ SIGN MODE ═══════════════ */
  const required     = fields.filter(f => f.required)
  const signedCount  = required.filter(f => signatures[f.id]).length

  return (
    <aside className="w-[224px] flex flex-col border-l border-[#D8D8D8] bg-white shrink-0 hidden md:flex">
      {/* CTA */}
      <div className="p-3 border-b border-[#EBEBEB]" style={{ background: allSigned ? '#F0FAF4' : '#F0F7FF' }}>
        <button
          onClick={allSigned ? onComplete : onGoToNext}
          className="w-full flex items-center justify-between px-4 py-2.5 text-white text-[13px] font-semibold transition-all"
          style={{ background: allSigned ? '#2DA44E' : '#1473E6', borderRadius: '2px' }}
        >
          <span>{allSigned ? 'Finaliser le document' : 'Aller au suivant'}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d={allSigned ? 'M5 13l4 4L19 7' : 'M9 5l7 7-7 7'} />
          </svg>
        </button>

        <p className="text-center text-[11px] mt-2" style={{ color: allSigned ? '#2DA44E' : '#1473E6' }}>
          {allSigned
            ? '✓ Tous les champs complétés'
            : `${required.length - signedCount} sur ${required.length} restant${required.length - signedCount > 1 ? 's' : ''}`}
        </p>

        <div className="mt-2 h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: required.length ? `${(signedCount / required.length) * 100}%` : '0%', background: allSigned ? '#2DA44E' : '#1473E6' }} />
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-3">
        <SectionTitle>Champs</SectionTitle>
        <div className="space-y-1.5">
          {fields.map((field, i) => {
            const signed  = !!signatures[field.id]
            const isNext  = nextUnsigned?.id === field.id
            const color   = FIELD_COLORS[field.type]
            return (
              <button key={field.id}
                onClick={() => onSignField(field.id)}
                className="w-full text-left p-2.5 transition-all"
                style={{
                  border: signed ? '1px solid #A5D6A7' : isNext ? `1.5px solid ${color}` : '1px solid #E5E5E5',
                  background: signed ? '#F1FBF4' : isNext ? `${color}10` : 'white',
                  borderRadius: '2px',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                    style={{ background: signed ? '#2DA44E' : isNext ? color : '#DDDDDD' }}>
                    {signed ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: signed ? '#2E7D32' : isNext ? color : '#555' }}>
                      {field.label}
                    </p>
                    <p className="text-[10px] text-[#AAAAAA] capitalize">{field.type}</p>
                  </div>
                  {isNext && !signed && (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-3 border-t border-[#EBEBEB] bg-[#FAFAFA]">
        <p className="text-[10px] text-[#BBBBBB] text-center">Conforme eIDAS · E-Sign</p>
      </div>
    </aside>
  )
}
