import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-[90] flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-xs px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-400/40 animate-pulse"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 text-amber-100" />
      <span>Offline Mode — Operating from local cache & storage</span>
    </div>
  );
};
