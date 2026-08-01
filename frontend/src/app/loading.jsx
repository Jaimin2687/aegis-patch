export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      {/* Subtle grid background */}
      <div className="fixed inset-0 dot-grid opacity-30 pointer-events-none" />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Animated shield icon */}
        <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-40" />
          <svg className="w-9 h-9 text-cyan-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-xl font-semibold text-white mb-1 tracking-tight">
          AEGIS-PATCH
        </h2>
        <p className="text-slate-500 text-sm mb-8">Initializing security engine...</p>

        {/* Skeleton — status panel */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex justify-between items-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                <div className="w-12 h-2 rounded bg-slate-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton — terminal */}
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-slate-700 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-slate-700 animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="w-3 h-3 rounded-full bg-slate-700 animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="ml-4 w-24 h-2 rounded bg-slate-800 animate-pulse" />
          </div>
          {/* Terminal lines */}
          <div className="p-4 space-y-2.5">
            {[80, 60, 90, 50, 70, 40].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded bg-slate-800 animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-1.5 mt-8">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
