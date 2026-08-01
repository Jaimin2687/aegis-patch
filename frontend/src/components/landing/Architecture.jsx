'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';

export default function Architecture() {
  const Node = ({ icon, label, className = "", isGlowing = false }) => (
    <div className={`relative flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm z-10 w-full sm:w-auto min-w-[200px] ${className}`}>
      <div className="text-gray-700">{icon}</div>
      <span className="text-sm font-semibold text-gray-900">{label}</span>
    </div>
  );

  const AnimatedArrow = ({ direction = "right", className = "" }) => {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {direction === "right" && (
          <div className="flex items-center">
            <div className="w-8 md:w-12 h-px bg-gray-300 relative">
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 -ml-1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
        {direction === "down" && (
          <div className="flex flex-col items-center">
            <div className="h-8 md:h-12 w-px bg-gray-300 relative">
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 -mt-1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="architecture" className="py-24 bg-gray-50 relative border-t border-gray-200 overflow-hidden">
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionHeading 
          eyebrow="System Design" 
          title="Pipeline Architecture" 
          subtitle="A high-level view of our scalable, event-driven infrastructure."
        />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm overflow-x-auto">
            
            <div className="min-w-[800px] flex flex-col items-center gap-6 py-4">
              
              {/* Row 1 */}
              <div className="flex items-center gap-2">
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                  label="Frontend UI" 
                />
                <AnimatedArrow direction="right" className="w-16" />
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>}
                  label="Pipeline Orchestrator" 
                  className="bg-gray-100"
                />
              </div>

              {/* Vertical Connector 1 */}
              <div className="flex w-full justify-center pl-[250px]">
                <AnimatedArrow direction="down" />
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-center gap-2 w-full">
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                  label="Repo Ingestor" 
                />
                <AnimatedArrow direction="right" className="w-12" />
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/><path d="m16 15-2.2-2.2"/></svg>}
                  label="Vuln Scanner" 
                />
                <AnimatedArrow direction="right" className="w-12" />
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>}
                  label="Patch Synthesizer" 
                />
                
                {/* Bi-directional arrow to LLM Engine */}
                <div className="flex items-center justify-center w-12 relative text-gray-400">
                  <div className="w-full h-px bg-gray-300"></div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-0 -ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute right-0 -mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>}
                  label="LLM Engine" 
                  className="bg-gray-100"
                />
              </div>

              {/* Vertical Connector 2 */}
              <div className="flex w-full justify-center pr-[20px]">
                <AnimatedArrow direction="down" />
              </div>

              {/* Row 3 */}
              <div className="flex items-center gap-2">
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>}
                  label="Regression Engine" 
                />
                <AnimatedArrow direction="right" className="w-16" />
                <Node 
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>}
                  label="PR Generator" 
                  className="bg-gray-100"
                />
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
