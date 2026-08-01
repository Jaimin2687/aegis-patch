'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';

const steps = [
  { icon: '📦', title: 'Clone', desc: 'Repository is cloned and dependency graph parsed from lockfiles' },
  { icon: '🔍', title: 'Scan', desc: 'Packages cross-referenced against OSV.dev vulnerability database' },
  { icon: '🔧', title: 'Patch', desc: '4-tier LLM failover engine synthesizes secure replacement code' },
  { icon: '🧪', title: 'Test', desc: 'Regression engine runs the full test suite against patched code' },
  { icon: '🚀', title: 'Deploy', desc: 'Patched code pushed to new branch and Pull Request auto-generated' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.3 } }
};

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#050505] relative border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <SectionHeading 
          eyebrow="Pipeline" 
          title="How It Works" 
          subtitle="A fully autonomous pipeline that secures your code while you sleep."
        />

        <motion.div 
          className="mt-16 relative flex flex-col md:flex-row justify-between items-start md:items-stretch gap-8 md:gap-4 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Connecting Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-500/20 via-indigo-500/20 to-cyan-500/20 md:hidden"></div>
          <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-cyan-500/20"></div>
          
          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              variants={stepVariants}
              className="relative flex md:flex-col items-start md:items-center gap-4 md:text-center w-full md:w-1/5 z-10"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
                {step.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 md:justify-center">
                  <span className="text-cyan-400 font-mono text-sm opacity-50">0{idx + 1}</span>
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
