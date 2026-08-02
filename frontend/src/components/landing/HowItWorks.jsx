'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';

const steps = [
  { icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ), title: 'Clone', desc: 'Repository is cloned and dependency graph parsed from lockfiles' },
  { icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ), title: 'Scan', desc: 'Packages cross-referenced against OSV.dev vulnerability database' },
  { icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
  ), title: 'Patch', desc: '4-tier LLM failover engine synthesizes secure replacement code' },
  { icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/></svg>
  ), title: 'Test', desc: 'Regression engine runs the full test suite against patched code' },
  { icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.82-13.2 22 22 0 0 1-1.35 15.68c.28.3.62.59 1 .83a22 22 0 0 1 12.3-9.51A22 22 0 0 1 15 12Z"/><path d="m9 12 3 3"/></svg>
  ), title: 'Deploy', desc: 'Patched code pushed to new branch and Pull Request auto-generated' }
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
    <section id="how-it-works" className="py-24 bg-white dark:bg-gray-900 dark:bg-gray-900 relative border-t border-gray-200 dark:border-gray-800 dark:border-gray-800">
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
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 md:hidden"></div>
          <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700"></div>
          
          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              variants={stepVariants}
              className="relative flex md:flex-col items-start md:items-center gap-4 md:text-center w-full md:w-1/5 z-10"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 dark:text-gray-300 shadow-sm z-10">
                {step.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2 flex items-center gap-2 md:justify-center">
                  <span className="text-gray-400 font-mono text-sm">0{idx + 1}</span>
                  {step.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
