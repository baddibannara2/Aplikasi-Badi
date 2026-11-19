import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400 bg-yellow-300 px-3.5 py-2 text-xs font-bold text-red-950 shadow-lg print:hidden">
      <WifiOff className="h-4 w-4 shrink-0 text-red-700" />
      <span>Mode Offline — Data tersimpan sementara & otomatis dikirim saat online.</span>
    </div>
  );
};
