'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShimmerButton } from '@/components/ui/shimmer-button';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      'fixed top-0 w-full z-50 transition-all duration-300',
      scrolled ? 'bg-slate-900/60 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' : 'bg-transparent'
    )}>
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <svg className="w-6 h-6 text-cyan-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
            AEGIS-PATCH
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="#architecture" className="hover:text-white transition-colors">Architecture</Link>
        </nav>

        <div className="hidden md:block">
          <Link href="/dashboard">
            <ShimmerButton className="text-sm px-4 py-2">
              Launch Dashboard →
            </ShimmerButton>
          </Link>
        </div>

        <button 
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col gap-4">
          <Link href="#features" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link href="#how-it-works" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
          <Link href="#architecture" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Architecture</Link>
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
             <ShimmerButton className="w-full text-sm py-2">Launch Dashboard →</ShimmerButton>
          </Link>
        </div>
      )}
    </header>
  );
}
