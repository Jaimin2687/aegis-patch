import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './components/theme-provider';
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
  }
};

import { ClerkProviderWrapper } from './components/ClerkProviderWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 text-gray-900 dark:text-gray-100 dark:text-gray-100 antialiased transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProviderWrapper clerkAppearance={clerkAppearance}>
            {children}
          </ClerkProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
