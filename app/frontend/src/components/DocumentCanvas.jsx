import { useRef, useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import PlacedField from './PlacedField'
import { FIELD_COLORS, FIELD_DEFAULTS } from '../App'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function DocumentCanvas({
  doc, fields, selectedId, editingId, placingType, signatures, mode,
  onPlaceField, onSelectField, onMoveField, onResizeField, onFieldClick,
  onCommitText, onCancelEdit,
}) {
  const containerRef = useRef(null)
  const pageRefs     = useRef({})          // { [pageNum]: domNode }
  const [pageWidth, setPageWidth] = useState(794)
  const [numPages,  setNumPages]  = useState(1)
  const [cursor,    setCursor]    = useState({ x: 0, y: 0 })

  /* responsive width */
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setPageWidth(Math.min(containerRef.current.clientWidth - 64, 794))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  /* reset page count when document changes */
  useEffect(() => {
    if (doc?.type !== 'pdf') setNumPages(1)
  }, [doc?.url])

  /* ghost cursor tracking */
  useEffect(() => {
    const h = (e) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  /* click on a page to place field */
  const handlePageClick = useCallback((e, pageNum) => {
    if (!placingType || mode !== 'place') return
    const node = pageRefs.current[pageNum]
    if (!node) return
    e.stopPropagation()
    const rect = node.getBoundingClientRect()
    onPlaceField(placingType, e.clientX - rect.left, e.clientY - rect.top, pageNum)
  }, [placingType, mode, onPlaceField])

  const ghostDef   = placingType ? FIELD_DEFAULTS[placingType] : null
  const ghostColor = placingType ? FIELD_COLORS[placingType]   : null

  const pagesArray = Array.from({ length: numPages }, (_, i) => i + 1)

  return (
    <main
      ref={containerRef}
      className="flex-1 overflow-y-auto py-6 px-4 relative"
      style={{ background: '#525659', cursor: placingType ? 'crosshair' : 'default' }}
    >
      {/* Ghost element following cursor */}
      {placingType && ghostDef && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left:   cursor.x - ghostDef.width / 2,
            top:    cursor.y - ghostDef.height / 2,
            width:  ghostDef.width,
            height: ghostDef.height,
            border: `2px dashed ${ghostColor}`,
            background: `${ghostColor}18`,
            borderRadius: '2px',
            opacity: 0.8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, color: ghostColor,
          }}
        >
          {ghostDef.label}
        </div>
      )}

      {/* All pages */}
      {doc?.type === 'image' ? (
        /* Images are single-page */
        <div
          ref={el => { pageRefs.current[1] = el }}
          className="mx-auto relative select-none"
          style={{ width: pageWidth, boxShadow: '0 1px 4px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)' }}
          onClick={e => handlePageClick(e, 1)}
        >
          <img src={doc.url} alt="Document" className="block w-full" draggable={false} />
          <PageFields pageNum={1} fields={fields} selectedId={selectedId} editingId={editingId}
            signatures={signatures} mode={mode}
            onSelectField={onSelectField} onFieldClick={onFieldClick}
            onMoveField={onMoveField} onResizeField={onResizeField}
            onCommitText={onCommitText} onCancelEdit={onCancelEdit}
          />
        </div>
      ) : doc?.type === 'pdf' ? (
        <Document
          file={doc.url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        >
          <div className="flex flex-col gap-4">
            {pagesArray.map(pageNum => (
              <div
                key={pageNum}
                ref={el => { pageRefs.current[pageNum] = el }}
                className="mx-auto relative select-none"
                style={{ width: pageWidth, boxShadow: '0 1px 4px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)' }}
                onClick={e => handlePageClick(e, pageNum)}
              >
                {numPages > 1 && (
                  <div className="absolute -top-5 left-0 text-[10px] text-white/40 select-none">
                    Page {pageNum}
                  </div>
                )}
                <Page
                  pageNumber={pageNum}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                <PageFields pageNum={pageNum} fields={fields} selectedId={selectedId} editingId={editingId}
                  signatures={signatures} mode={mode}
                  onSelectField={onSelectField} onFieldClick={onFieldClick}
                  onMoveField={onMoveField} onResizeField={onResizeField}
                  onCommitText={onCommitText} onCancelEdit={onCancelEdit}
                />
              </div>
            ))}
          </div>
        </Document>
      ) : (
        <div
          ref={el => { pageRefs.current[1] = el }}
          className="mx-auto relative select-none bg-white"
          style={{ width: pageWidth, height: 1100, boxShadow: '0 1px 4px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.35)' }}
          onClick={e => handlePageClick(e, 1)}
        />
      )}

      {/* Tip when in place mode */}
      {mode === 'place' && placingType && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1B1B1B] text-white text-xs px-4 py-2 rounded-full shadow-lg z-40 pointer-events-none">
          Cliquez sur le document pour placer le champ · <span className="opacity-60">Échap pour annuler</span>
        </div>
      )}

      <div className="h-12" />
    </main>
  )
}

/* Fields overlay for a single page */
function PageFields({ pageNum, fields, selectedId, editingId, signatures, mode,
  onSelectField, onFieldClick, onMoveField, onResizeField, onCommitText, onCancelEdit }) {
  const pageFields = fields.filter(f => (f.page ?? 1) === pageNum)
  return (
    <>
      {pageFields.map(field => (
        <PlacedField
          key={field.id}
          field={field}
          isSelected={selectedId === field.id}
          isEditing={editingId === field.id}
          signature={signatures[field.id]}
          mode={mode}
          onSelect={(e) => {
            e.stopPropagation()
            if (mode === 'place') onSelectField(field.id)
            else onFieldClick(field.id)
          }}
          onMove={(x, y) => onMoveField(field.id, x, y)}
          onResize={(w, h) => onResizeField(field.id, w, h)}
          onCommitText={onCommitText}
          onCancelEdit={onCancelEdit}
        />
      ))}
    </>
  )
}
