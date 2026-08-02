'use client';
import { useState } from 'react';

export default function UrlInput({ onSubmit, isRunning }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid GitHub URL');
      return;
    }
    
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/.test(url.trim())) {
      setError('Must be a valid GitHub repository URL (e.g., https://github.com/user/repo)');
      return;
    }
    
    setError('');
    onSubmit(url.trim());
  };

  return (
    <div className="bg-[#0a0a0a]/50 backdrop-blur-[12px] border border-[#222] p-6 rounded-xl w-full max-w-3xl mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="repo-url" className="text-sm font-medium text-[#ccc]">Target Repository</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#888]" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="repo-url"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              disabled={isRunning}
              placeholder="https://github.com/organization/repository"
              className={`w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border ${error ? 'border-red-500' : 'border-[#333] focus:border-[#555]'} rounded-md text-white placeholder-[#666] outline-none transition-colors disabled:opacity-50`}
            />
          </div>
          <button
            type="submit"
            disabled={isRunning}
            className="whitespace-nowrap px-6 py-2.5 bg-white dark:bg-gray-900 dark:bg-gray-900 text-black dark:text-gray-100 font-medium rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black dark:text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Start Patching'
            )}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </form>
    </div>
  );
}
