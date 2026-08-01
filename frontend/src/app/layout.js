import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
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
  layout: {
    logoPlacement: 'none',
    showOptionalFields: false,
    socialButtonsVariant: 'iconButton',
  },
  variables: {
    colorPrimary: '#111827',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#111827',
    colorText: '#111827',
    colorTextSecondary: '#4b5563',
    colorTextOnPrimaryBackground: '#ffffff',
    colorDanger: '#ef4444',
    colorSuccess: '#10b981',
    colorNeutral: '#111827',
    colorShimmer: '#f3f4f6',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    fontFamilyButtons: 'var(--font-inter), system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    card: 'bg-white border border-gray-200 shadow-sm',
    headerTitle: 'text-gray-900',
    headerSubtitle: 'text-gray-500',
    formButtonPrimary: 'bg-gray-900 hover:bg-gray-800 text-white font-semibold',
    formFieldInput: 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-400',
    formFieldLabel: 'text-gray-700 font-medium',
    footerAction: 'text-gray-500',
    footerActionLink: 'text-blue-600 hover:text-blue-700',
    dividerLine: 'bg-gray-200',
    dividerText: 'text-gray-500',
    socialButtonsBlockButton: 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50',
    socialButtonsBlockButtonText: 'text-gray-900',
    badge: 'hidden',
    logoBox: 'hidden',
    userButtonPopoverCard: 'bg-white border border-gray-200 shadow-sm',
    userButtonPopoverActions: 'bg-white',
    userButtonPopoverActionButton: 'hover:bg-gray-50 transition-colors',
    userButtonPopoverActionButtonText: '!text-gray-900 font-medium',
    userButtonPopoverActionButtonIcon: '!text-gray-500',
    userButtonPopoverFooter: 'border-t border-gray-200',
    userPreviewMainIdentifier: '!text-gray-900 font-semibold',
    userPreviewSecondaryIdentifier: '!text-gray-500',
    userButtonAvatarBox: 'ring-2 ring-gray-100',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body className="bg-gray-50 text-gray-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
