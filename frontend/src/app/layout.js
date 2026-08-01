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
    colorBackground: '#161616',
    colorInputBackground: '#1f1f1f',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#bbbbbb',
    colorTextOnPrimaryBackground: '#000000',
    colorDanger: '#ef4444',
    colorSuccess: '#22d3ee',
    colorNeutral: '#ffffff',
    colorShimmer: '#ffffff10',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    fontFamilyButtons: 'var(--font-inter), system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    card: 'bg-[#161616] border border-white/10 shadow-2xl',
    headerTitle: 'text-white',
    headerSubtitle: 'text-[#bbbbbb]',
    formButtonPrimary: 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-semibold',
    formFieldInput: 'bg-[#1f1f1f] border-white/15 text-white placeholder-slate-500 focus:border-cyan-500/60',
    formFieldLabel: 'text-[#cccccc] font-medium',
    footerAction: 'text-[#aaaaaa]',
    footerActionLink: 'text-cyan-400 hover:text-cyan-300',
    dividerLine: 'bg-white/10',
    dividerText: 'text-[#888888]',
    socialButtonsBlockButton: 'bg-[#1f1f1f] border-white/15 text-white hover:bg-[#2a2a2a]',
    socialButtonsBlockButtonText: 'text-white',
    badge: 'hidden',
    logoBox: 'hidden',
    // UserButton popup
    userButtonPopoverCard: 'bg-[#161616] border border-white/10 shadow-2xl',
    userButtonPopoverActions: 'bg-[#161616]',
    userButtonPopoverActionButton: 'hover:bg-white/10 transition-colors',
    userButtonPopoverActionButtonText: '!text-white font-medium',
    userButtonPopoverActionButtonIcon: '!text-white',
    userButtonPopoverFooter: 'border-t border-white/10',
    userPreviewMainIdentifier: '!text-white font-semibold',
    userPreviewSecondaryIdentifier: '!text-[#bbbbbb]',
    userButtonAvatarBox: 'ring-2 ring-white/15',
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
