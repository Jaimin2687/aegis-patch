'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const features = [
  { title: '4-Tier LLM Failover', desc: 'Groq → Cerebras → Gemini cascading engine ensures maximum uptime and fastest resolution.', icon: '🧠' },
  { title: 'Deep OSV Scanner', desc: 'Cross-reference dependencies against 200k+ known vulnerabilities in the OSV database instantly.', icon: '🛡️' },
  { title: 'Smart Patch Synthesis', desc: 'AI-generated patches that are syntactically correct and specifically designed to pass existing regression tests.', icon: '✨' },
  { title: 'Regression Engine', desc: 'Automated test suite execution with built-in retry loops to verify patch integrity before deployment.', icon: '🔁' },
  { title: 'Auto PR Generation', desc: 'Zero-touch GitHub Pull Request creation with detailed changelogs and security context included.', icon: '🤖' },
  { title: 'Real-time Dashboard', desc: 'WebSocket-powered live pipeline monitoring for complete observability into the patching process.', icon: '📊' }
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
    <section id="features" className="py-24 bg-black relative border-t border-white/5">
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
              <SpotlightCard className="h-full bg-slate-900/40 border border-white/10 p-6 rounded-2xl flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-2xl mb-4 border border-white/5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
