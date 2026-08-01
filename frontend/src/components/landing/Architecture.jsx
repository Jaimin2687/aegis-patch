'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 bg-[#0a0a0a] relative border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          eyebrow="System Design" 
          title="Pipeline Architecture" 
          subtitle="A high-level view of our scalable, event-driven infrastructure."
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-x-auto shadow-2xl">
            <div className="min-w-[800px] flex flex-col items-center gap-8 py-8">
              {/* Row 1 */}
              <div className="flex items-center gap-4">
                <div className="bg-slate-800/50 border border-white/10 rounded-lg px-6 py-3 text-sm font-medium text-white shadow-lg text-center w-40">
                  Frontend UI
                </div>
                <div className="text-cyan-400 animate-pulse font-bold text-xl">→</div>
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg px-6 py-3 text-sm font-medium text-white shadow-lg text-center w-48 relative">
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                  Pipeline Orchestrator
                </div>
              </div>

              {/* Vertical Connector */}
              <div className="h-8 w-px bg-gradient-to-b from-indigo-500/50 to-cyan-500/50 relative ml-8"></div>

              {/* Row 2 */}
              <div className="flex items-center justify-center gap-4 w-full">
                <div className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 text-center w-36 shadow-md">
                  Repo Ingestor
                </div>
                <div className="text-slate-500 font-bold text-xl">→</div>
                <div className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 text-center w-36 shadow-md">
                  Vuln Scanner
                </div>
                <div className="text-slate-500 font-bold text-xl">→</div>
                <div className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 text-center w-36 shadow-md">
                  Patch Synthesizer
                </div>
                <div className="text-slate-500 font-bold text-xl">↔</div>
                <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm font-medium text-cyan-100 text-center w-36 shadow-lg shadow-cyan-900/20">
                  LLM Engine
                </div>
              </div>

              {/* Vertical Connector */}
              <div className="h-8 w-px bg-gradient-to-b from-cyan-500/50 to-slate-500/50 ml-12"></div>

              {/* Row 3 */}
              <div className="flex items-center gap-4">
                <div className="bg-slate-800/50 border border-white/10 rounded-lg px-6 py-3 text-sm font-medium text-slate-300 text-center w-40 shadow-md">
                  Regression Engine
                </div>
                <div className="text-slate-500 font-bold text-xl">→</div>
                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg px-6 py-3 text-sm font-medium text-emerald-100 text-center w-40 shadow-lg shadow-emerald-900/20">
                  PR Generator
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
