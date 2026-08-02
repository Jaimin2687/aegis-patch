'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/app/components/theme-toggle';


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

  const handleNavClick = (targetId) => {
    // Rely on native CSS scroll-behavior: smooth
    // Just close the mobile menu
    setMobileMenuOpen(false);
  };

  return (
    <header className={cn(
      'fixed top-0 w-full z-50 transition-all duration-300',
      scrolled ? 'bg-white dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm' : 'bg-transparent'
    )}>
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <svg className="w-6 h-6 text-gray-900 dark:text-gray-100 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-gray-100">
            AEGIS-PATCH
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
          <a href="#features" onClick={() => handleNavClick('features')} className="hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Features</a>
          <a href="#how-it-works" onClick={() => handleNavClick('how-it-works')} className="hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">How It Works</a>
          <a href="#architecture" onClick={() => handleNavClick('architecture')} className="hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Architecture</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/dashboard" className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
            Launch Dashboard →
          </Link>
        </div>

        <button 
          className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4">
          <a href="#features" onClick={() => handleNavClick('features')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Features</a>
          <a href="#how-it-works" onClick={() => handleNavClick('how-it-works')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">How It Works</a>
          <a href="#architecture" onClick={() => handleNavClick('architecture')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors">Architecture</a>
          <Link href="/dashboard" className="w-full text-center px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all" onClick={() => setMobileMenuOpen(false)}>
             Launch Dashboard →
          </Link>
          <div className="flex justify-center pt-2">
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
