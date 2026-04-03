import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = "" }) => {
  return (
    <div className={`bg-green-950/90 backdrop-blur-xl border border-amber-500/30 shadow-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
};