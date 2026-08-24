'use client';

import { useEffect, useState } from 'react';

export type AppMode = 'loading' | 'demo' | 'account' | 'anonymous';

export interface AccountSession {
  authenticated: true;
  mode: 'account';
  user: { id: string; email: string; firstName: string; lastName?: string | null };
  workspace: { id: string; name: string; slug: string };
  role: string;
}

export function useAccountMode() {
  const [mode, setMode] = useState<AppMode>('loading');
  const [session, setSession] = useState<AccountSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/auth/session', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok && data.mode === 'account') {
          setSession(data as AccountSession);
          setMode('account');
        } else if (response.ok && data.mode === 'demo') {
          setMode('demo');
        } else {
          setMode('anonymous');
        }
      })
      .catch(() => {
        if (!cancelled) setMode('anonymous');
      });
    return () => { cancelled = true; };
  }, []);

  return { mode, session };
}

