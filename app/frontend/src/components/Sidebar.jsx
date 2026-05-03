export default function ThumbnailPanel() {
  return (
    <div
      className="w-[60px] flex flex-col items-center py-3 gap-2 border-r border-black/30 overflow-y-auto shrink-0 hidden lg:flex"
      style={{ background: '#3C3C3C' }}
    >
      <div className="cursor-pointer group">
        <div
          className="w-10 h-[56px] bg-white rounded-sm overflow-hidden relative"
          style={{ boxShadow: '0 0 0 2px #1473E6, 0 2px 8px rgba(0,0,0,0.5)' }}
        >
          <div className="absolute inset-[3px] flex flex-col gap-[2px]">
            <div className="h-[3px] w-full bg-[#1473E6]/30 rounded-sm" />
            {[85, 55, 75, 45, 68, 50, 72, 40, 60, 52, 44, 65].map((w, i) => (
              <div key={i} className="h-[2px] bg-slate-300 rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <p className="text-center text-white/50 text-[10px] mt-1.5 font-medium">1</p>
      </div>
    </div>
  )
}
