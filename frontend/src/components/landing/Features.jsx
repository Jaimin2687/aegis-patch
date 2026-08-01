'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const features = [
  { title: '4-Tier LLM Failover', desc: 'Groq → Cerebras → Gemini cascading engine ensures maximum uptime and fastest resolution.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 18 2 2 4-4"/><path d="M22 13v-2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2"/><path d="M22 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/><path d="M22 20a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/><path d="m2 13 2-2 4 4"/></svg>
  ) },
  { title: 'Deep OSV Scanner', desc: 'Cross-reference dependencies against 200k+ known vulnerabilities in the OSV database instantly.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/><path d="m16 15-2.2-2.2"/></svg>
  ) },
  { title: 'Smart Patch Synthesis', desc: 'AI-generated patches that are syntactically correct and specifically designed to pass existing regression tests.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
  ) },
  { title: 'Regression Engine', desc: 'Automated test suite execution with built-in retry loops to verify patch integrity before deployment.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
  ) },
  { title: 'Auto PR Generation', desc: 'Zero-touch GitHub Pull Request creation with detailed changelogs and security context included.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>
  ) },
  { title: 'Real-time Dashboard', desc: 'WebSocket-powered live pipeline monitoring for complete observability into the patching process.', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="m22 7-6 5-4-3-6 5"/></svg>
  ) }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50 relative border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          eyebrow="Capabilities" 
          title="Built for Security Engineers" 
          subtitle="Everything you need to automate your vulnerability patching workflow."
        />

        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={cardVariants}>
              <SpotlightCard className="h-full bg-white border border-gray-200 p-6 rounded-2xl flex flex-col shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 mb-4 border border-gray-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
