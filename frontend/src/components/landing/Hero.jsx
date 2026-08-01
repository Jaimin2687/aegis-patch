'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { ShimmerButton } from '@/components/ui/shimmer-button';

const HeroScene = dynamic(() => import('@/components/three/HeroScene').then(mod => mod.HeroScene), { ssr: false });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 dot-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-40"></div>
      
      <div className="absolute inset-0 pointer-events-none z-0">
         <HeroScene />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 font-mono bg-cyan-950/30 text-cyan-400 border-cyan-500/30">
              v1.0.0 · Zero Human Intervention
            </Badge>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent leading-tight"
          >
            Autonomous<br />Security Patching
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
          >
            Submit a repository. We detect vulnerabilities, synthesize patches, run regression tests, and open Pull Requests — with zero human intervention.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
          >
            <Link href="/dashboard">
              <ShimmerButton className="px-8 py-4 text-base font-semibold">
                Launch Dashboard →
              </ShimmerButton>
            </Link>
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
              <button className="px-8 py-4 text-base font-semibold rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all backdrop-blur-sm">
                View on GitHub
              </button>
            </Link>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-20 flex flex-wrap justify-center gap-4 md:gap-12 text-sm font-medium text-slate-500"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
              4-Tier LLM Failover
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.6)]"></div>
              OSV.dev Scanner
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.6)]"></div>
              Auto PR Generation
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
