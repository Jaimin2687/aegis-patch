'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ClerkProviderWrapper({ children, clerkAppearance }) {
  const { resolvedTheme } = useTheme();
  
  return (
    <ClerkProvider
      appearance={{
        ...clerkAppearance,
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
