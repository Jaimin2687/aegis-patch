import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'AEGIS-PATCH | Autonomous Security Patching',
  description: 'An autonomous engine for generative intelligent security patching. Detect vulnerabilities, synthesize patches, run regression tests, and open Pull Requests — with zero human intervention.',
  keywords: ['security', 'vulnerability', 'patching', 'AI', 'LLM', 'autonomous', 'GitHub'],
  openGraph: {
    title: 'AEGIS-PATCH | Autonomous Security Patching',
    description: 'Submit a repository. We detect vulnerabilities, synthesize patches, and open Pull Requests — automatically.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const clerkAppearance = {
  baseTheme: dark,
  layout: {
    logoPlacement: 'none',
    showOptionalFields: false,
    socialButtonsVariant: 'iconButton',
  },
  variables: {
    colorPrimary: '#22d3ee',
    colorBackground: '#0a0a0a',
    colorInputBackground: '#111111',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#888888',
    colorDanger: '#ef4444',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    fontFamilyButtons: 'var(--font-inter), system-ui, sans-serif',
  },
  elements: {
    card: 'bg-[#0a0a0a] border border-white/[0.08] shadow-2xl',
    headerTitle: 'text-white',
    headerSubtitle: 'text-slate-400',
    formButtonPrimary: 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 transition-all duration-300',
    formFieldInput: 'bg-[#111] border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20',
    footerAction: 'text-slate-400',
    footerActionLink: 'text-cyan-400 hover:text-cyan-300',
    identityPreview: 'bg-[#111] border-white/10',
    formFieldLabel: 'text-slate-300',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-500',
    socialButtonsBlockButton: 'bg-[#111] border-white/10 text-white hover:bg-[#1a1a1a]',
    socialButtonsBlockButtonText: 'text-white',
    internal: 'hidden',
    badge: 'hidden',
    logoBox: 'hidden',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
        <body className="bg-black text-white antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
