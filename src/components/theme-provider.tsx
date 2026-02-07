'use client';

import { useChatStore } from '@/store/use-chat-store';
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useChatStore((state) => state.settings);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--background', settings.primaryColor);
    root.style.setProperty('--foreground', settings.secondaryColor);
    root.style.setProperty('--primary', settings.secondaryColor);
    root.style.setProperty('--primary-foreground', settings.primaryColor);
    root.style.setProperty('--secondary', settings.secondaryColor);
    root.style.setProperty('--secondary-foreground', settings.primaryColor);
    root.style.setProperty('--border', settings.secondaryColor);
    root.style.setProperty('--input', settings.secondaryColor);
    root.style.setProperty('--ring', settings.secondaryColor);

    // Also update card, popover etc for consistency
    root.style.setProperty('--card', settings.primaryColor);
    root.style.setProperty('--card-foreground', settings.secondaryColor);
    root.style.setProperty('--popover', settings.primaryColor);
    root.style.setProperty('--popover-foreground', settings.secondaryColor);

    // Since primary color is background, we might need to adjust muted colors too
    // For now let's just use secondary with some opacity if needed,
    // but the user wants minimalist black/white or custom.
  }, [settings.primaryColor, settings.secondaryColor]);

  return <>{children}</>;
}
