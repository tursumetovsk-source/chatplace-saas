import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'info' | 'purple' }> = ({
  children,
  variant = 'default'
}) => {
  const styles = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/50',
    info: 'bg-blue-950/80 text-blue-400 border-blue-800/50',
    purple: 'bg-purple-950/80 text-purple-400 border-purple-800/50'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${styles[variant]}`}>
      {children}
    </span>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md rounded-xl p-5 shadow-xl ${className}`}>
      {children}
    </div>
  );
};
