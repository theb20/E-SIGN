import { useRef, useState } from 'react'

export default function UploadScreen({ onUpload }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handle = (file) => { if (file) onUpload(file) }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded flex items-center justify-center bg-[#FA0F00]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
            <path d="M3 3h9l5 5v9H3V3z" fill="white" />
            <path d="M12 3v6h5" stroke="rgba(200,0,0,0.4)" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <span className="text-[#1B1B1B] text-xl font-bold tracking-tight">E·SIGN</span>
      </div>

      <div className="w-full max-w-xl">
        <h1 className="text-center text-[24px] font-bold text-[#1B1B1B] mb-1.5">
          Importer un document à signer
        </h1>
        <p className="text-center text-[13px] text-[#888] mb-8">
          Placez ensuite vos champs de signature, texte ou date où vous le souhaitez
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed rounded-sm p-16 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragging ? '#1473E6' : '#CCCCCC',
            background: dragging ? '#F0F7FF' : 'white',
          }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden"
            onChange={(e) => handle(e.target.files[0])} />

          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: dragging ? '#DDEEFF' : '#F0F7FF' }}>
            <svg className="w-8 h-8 text-[#1473E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <p className="text-[15px] font-semibold text-[#333] mb-1">
            {dragging ? 'Relâchez pour importer' : 'Glissez votre fichier ici'}
          </p>
          <p className="text-[13px] text-[#AAAAAA]">
            ou <span className="text-[#1473E6] font-medium underline-offset-2 underline">parcourez vos fichiers</span>
          </p>
          <p className="text-[11px] text-[#CCCCCC] mt-4">PDF · PNG · JPG — jusqu'à 50 Mo</p>
        </div>

        {/* Supported formats */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {[
            { ext: 'PDF', icon: '📄' },
            { ext: 'PNG', icon: '🖼️' },
            { ext: 'JPG', icon: '🖼️' },
          ].map(({ ext, icon }) => (
            <div key={ext} className="flex items-center gap-1.5 text-[11px] text-[#AAAAAA]">
              <span>{icon}</span><span>{ext}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
