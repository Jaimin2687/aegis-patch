'use client';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Architecture from '@/components/landing/Architecture';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 selection:bg-cyan-500/30">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Architecture />
      </main>
      <Footer />
    </div>
  );
}
