'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import dynamic from 'next/dynamic';

const Hero3D = dynamic(() => import('./Hero3D'), { ssr: false });

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 pt-20">
      <Hero3D />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50 dark:opacity-30 z-0" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 font-mono bg-white dark:bg-gray-900 dark:bg-gray-900 text-gray-700 dark:text-gray-300 dark:text-gray-300 border border-gray-300 dark:border-gray-700 dark:border-gray-700">
              v1.0.0 · Zero Human Intervention
            </Badge>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-gray-900 dark:text-gray-100 dark:text-gray-100 leading-tight"
          >
            Autonomous<br />Security Patching
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed"
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
            <Link href="https://github.com/Jaimin2687/aegis-patch" target="_blank" rel="noopener noreferrer">
              <button className="px-8 py-4 text-base font-semibold rounded-full border border-gray-300 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-900 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:text-gray-100 transition-all shadow-sm">
                View on GitHub
              </button>
            </Link>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-20 flex flex-wrap justify-center gap-4 md:gap-12 text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              4-Tier LLM Failover
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              OSV.dev Scanner
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              Auto PR Generation
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
