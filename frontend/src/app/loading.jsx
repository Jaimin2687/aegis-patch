export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 font-sans">
      <div className="relative z-10 w-full max-w-md text-center">
        {/* Animated spinner */}
        <div className="mx-auto w-16 h-16 mb-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-center relative">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 tracking-tight">
          AEGIS-PATCH
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Loading dashboard...</p>

        {/* Skeleton — status panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex justify-between items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                <div className="w-12 h-2 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
