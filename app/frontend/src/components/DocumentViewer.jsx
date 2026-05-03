import { FIELDS } from '../App'
import SignatureField from './SignatureField'

export default function PDFCanvas({ signatures, onFieldClick }) {
  return (
    <main className="flex-1 overflow-y-auto py-6 px-4" style={{ background: '#525659' }}>
      {/* A4 page */}
      <div
        className="mx-auto bg-white relative"
        style={{
          maxWidth: '794px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)',
          fontFamily: "'Arial','Helvetica',sans-serif",
        }}
      >
        <div className="px-[72px] py-[56px] text-[13px] text-[#333] leading-[1.65]">

          {/* Letterhead */}
          <div className="flex justify-between items-start mb-7 pb-5 border-b border-[#E5E5E5]">
            <div>
              <div className="text-[#1473E6] font-bold text-[18px] tracking-tight">TechSolutions</div>
              <div className="text-[#888] text-[11px] mt-0.5">12 Rue de l'Innovation — 75001 Paris</div>
              <div className="text-[#888] text-[11px]">contact@techsolutions.fr</div>
            </div>
            <div className="text-right">
              <div className="inline-block font-mono bg-[#F3F3F3] border border-[#E0E0E0] px-2 py-0.5 rounded text-[10px] text-[#555] mb-1.5">
                REF-2024-0042
              </div>
              <div className="text-[#888] text-[11px]">24 avril 2024</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-[16px] font-bold text-[#1B1B1B] tracking-wide uppercase mb-1">
            Contrat de Prestation de Services
          </h1>
          <p className="text-center text-[10px] text-[#AAAAAA] mb-7 uppercase tracking-wider">
            Version finale · En attente de signature
          </p>

          {/* Parties */}
          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Entre les soussignés
            </h2>
            <div className="pl-3 border-l-[2px] border-[#E8E8E8] space-y-2 text-[#444]">
              <p>
                <strong className="text-[#1B1B1B]">TechSolutions SAS</strong>, société par actions simplifiée au capital de
                50 000 €, dont le siège social est situé au 12 Rue de l'Innovation, 75001 Paris, immatriculée au RCS de Paris
                sous le numéro 852 147 963, représentée par M. Jean Dupont, Directeur Général,
                ci-après dénommée le <em>« Prestataire »</em> ;
              </p>
              <p className="text-[#AAAAAA] text-center text-[11px]">— ET —</p>
              <p>
                <strong className="text-[#1B1B1B]">Le Client</strong>, dont les coordonnées sont enregistrées dans le système
                d'information du Prestataire, ci-après dénommé le <em>« Client »</em>.
              </p>
            </div>
          </section>

          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 1 — Objet du contrat
            </h2>
            <p className="text-[#444]">
              Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire s'engage à
              fournir au Client des services de développement logiciel, de conseil en transformation digitale et de
              maintenance applicative, conformément au cahier des charges annexé au présent contrat.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 2 — Durée
            </h2>
            <p className="text-[#444]">
              Le présent contrat est conclu pour une durée déterminée de douze (12) mois à compter de sa date de
              signature, soit jusqu'au 24 avril 2025. Il est renouvelable par tacite reconduction pour des périodes
              successives d'un an, sauf dénonciation par LRAR adressée au moins trois (3) mois avant l'échéance.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 3 — Tarifs et paiement
            </h2>
            <div className="border border-[#E5E5E5] rounded overflow-hidden my-2">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#F5F5F5] border-b border-[#E5E5E5]">
                    <th className="text-left px-3 py-2 font-semibold text-[#555]">Prestation</th>
                    <th className="text-right px-3 py-2 font-semibold text-[#555]">Tarif HT</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Développement sur mesure', '180 €/jour'],
                    ['Conseil & Architecture', '220 €/jour'],
                    ['Maintenance corrective', '150 €/jour'],
                    ['Astreinte hors heures ouvrées', '50 €/heure'],
                  ].map(([l, p], i) => (
                    <tr key={i} className={`border-b border-[#F0F0F0] last:border-0 ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                      <td className="px-3 py-1.5 text-[#444]">{l}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-[#444]">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[#444] mt-2">
              Les factures sont payables à 30 jours. Tout retard entraîne des pénalités au taux légal majoré de 10 points.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 4 — Propriété intellectuelle
            </h2>
            <p className="text-[#444]">
              Les livrables réalisés dans le cadre du présent contrat sont cédés au Client en pleine propriété
              à compter du paiement intégral des sommes dues. Le Prestataire conserve la propriété de ses outils,
              méthodes et savoir-faire développés antérieurement ou indépendamment du présent contrat.
            </p>
          </section>

          {/* Article 5 — with initials field */}
          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 5 — Confidentialité
            </h2>
            <p className="text-[#444] mb-3">
              Chaque partie s'engage à maintenir strictement confidentielles toutes les informations dont elle
              pourrait avoir connaissance dans le cadre du présent contrat, pendant toute la durée du contrat
              et pendant une période de cinq (5) ans après son terme.
            </p>
            <div className="flex items-start gap-4 p-3 bg-[#FFFBEC] border border-[#E8C94B] rounded">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#7A5800] uppercase tracking-wider mb-1">Confirmation requise</p>
                <p className="text-[11px] text-[#6B5000]">
                  En apposant vos initiales, vous confirmez avoir pris connaissance des dispositions de l'Article 5
                  relatives à la confidentialité des informations échangées.
                </p>
              </div>
              <div className="shrink-0">
                <SignatureField
                  field={FIELDS[0]}
                  signature={signatures['initials-1']}
                  onClick={() => onFieldClick('initials-1')}
                  isNext={!signatures['initials-1']}
                  compact
                />
              </div>
            </div>
          </section>

          <section className="mb-5">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 6 — Responsabilité
            </h2>
            <p className="text-[#444]">
              La responsabilité du Prestataire ne pourra être engagée qu'en cas de faute prouvée et sera
              limitée au montant des sommes effectivement versées par le Client au cours des douze derniers
              mois précédant le fait générateur du dommage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-2 pb-1 border-b border-[#F0F0F0]">
              Article 7 — Droit applicable
            </h2>
            <p className="text-[#444]">
              Le présent contrat est régi par le droit français. Le Tribunal de Commerce de Paris sera seul
              compétent pour trancher tout litige non résolu à l'amiable.
            </p>
          </section>

          {/* Signature block */}
          <div className="border-t-2 border-[#E0E0E0] pt-6">
            <h2 className="text-[10px] font-bold text-[#888] uppercase tracking-[0.12em] mb-5">Signatures</h2>
            <div className="grid grid-cols-2 gap-10">
              {/* Prestataire — already signed */}
              <div>
                <p className="text-[11px] text-[#666] font-semibold mb-0.5">Pour le Prestataire</p>
                <p className="text-[11px] text-[#AAAAAA] mb-2.5">TechSolutions SAS</p>
                <div
                  className="h-14 border border-[#4CAF50] bg-[#F1FBF4] rounded flex items-center justify-center"
                >
                  <span className="text-[#1B1B1B] text-2xl" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    Jean Dupont
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-[#888]">Jean Dupont — DG</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded font-semibold">
                    ✓ 23/04/24
                  </span>
                </div>
              </div>

              {/* Client */}
              <div>
                <p className="text-[11px] text-[#666] font-semibold mb-0.5">Pour le Client</p>
                <p className="text-[11px] text-[#AAAAAA] mb-2.5">Signature électronique requise</p>
                <SignatureField
                  field={FIELDS[1]}
                  signature={signatures['sig-client']}
                  onClick={() => onFieldClick('sig-client')}
                  isNext={!!signatures['initials-1'] && !signatures['sig-client']}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-[#888]">Le Client</span>
                  {signatures['sig-client'] && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded font-semibold">
                      ✓ {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page footer */}
        <div className="px-[72px] py-3 border-t border-[#F0F0F0] flex justify-between">
          <span className="text-[10px] text-[#CCCCCC]">REF-2024-0042 · Conforme eIDAS · E-Sign</span>
          <span className="text-[10px] text-[#CCCCCC]">Page 1 sur 1</span>
        </div>
      </div>

      <div className="h-10" />
    </main>
  )
}
