'use client';

import Link from 'next/link';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Badge } from '@/components/ui/badge';

export default function Footer() {
  return (
    <footer className="bg-white pt-24 pb-8 border-t border-gray-200 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-gray-900">
          Ship Secure Code. Automatically.
        </h2>
        
        <Link href="/dashboard" className="mb-24">
          <ShimmerButton className="px-8 py-4 text-base font-semibold">
            Get Started →
          </ShimmerButton>
        </Link>

        <div className="w-full border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm font-medium">
            AEGIS-PATCH © 2026. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="https://github.com" className="text-gray-400 hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </Link>
            
            <div className="flex gap-2">
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs">Next.js</Badge>
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs">Tailwind</Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
