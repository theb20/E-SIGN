import { useEffect, useState } from 'react'
import { FIELD_COLORS } from '../App'

export default function CompletionScreen({ doc, fields }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])
  const signedDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-6">
      <div
        className={`bg-white w-full max-w-md transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.12)', borderRadius: '2px' }}
      >
        <div className="h-1.5 bg-[#2DA44E] rounded-t-sm" />

        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#E8F5E9] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#2DA44E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-[20px] font-bold text-[#1B1B1B] mb-1">Document signé avec succès</h1>
          <p className="text-[13px] text-[#888] mb-7">
            Votre signature électronique a été appliquée sur tous les champs requis.
          </p>

          {/* Summary */}
          <div className="text-left border border-[#E8E8E8] mb-6" style={{ borderRadius: '2px' }}>
            <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-[#E8E8E8]">
              <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Résumé</p>
            </div>
            {[
              ['Fichier', doc?.name ?? '—'],
              ['Champs signés', `${fields.length} champ${fields.length !== 1 ? 's' : ''}`],
              ['Date de signature', signedDate],
              ['Statut', '✓ Complété'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center px-4 py-2.5 border-b border-[#F5F5F5] last:border-0">
                <span className="text-[12px] text-[#888]">{k}</span>
                <span className={`text-[12px] font-semibold ${k === 'Statut' ? 'text-[#2DA44E]' : 'text-[#333]'}`}>{v}</span>
              </div>
            ))}
          </div>

          {/* Field types used */}
          {fields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mb-7">
              {[...new Set(fields.map(f => f.type))].map(type => (
                <span key={type} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white capitalize"
                  style={{ background: FIELD_COLORS[type] }}>
                  {type}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="flex-1 h-9 border border-[#CCCCCC] text-[13px] font-medium text-[#333] hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-1.5"
              style={{ borderRadius: '2px' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-9 text-white text-[13px] font-semibold hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
              style={{ background: '#1473E6', borderRadius: '2px' }}
            >
              Nouveau document
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA]">
          <p className="text-[10px] text-[#BBBBBB] text-center">Signature sécurisée conforme eIDAS · E-Sign</p>
        </div>
      </div>
    </div>
  )
}
