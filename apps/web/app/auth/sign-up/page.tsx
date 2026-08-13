'use client';

import React from 'react';
import AuthModal from '../../../components/AuthModal';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <AuthModal isOpen={true} onClose={() => window.location.href = '/'} initialMode="sign-up" />
    </div>
  );
}
