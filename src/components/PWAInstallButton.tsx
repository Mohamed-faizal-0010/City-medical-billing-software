import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PlayStoreInstallModal } from './PlayStoreInstallModal';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // Suppress button if already running in installed standalone mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (!res?.success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        id="navbar-pwa-install-btn"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all transform active:scale-95 ${className}`}
        title="Install City Medical Android / Play Store App"
      >
        <Smartphone className="w-3.5 h-3.5 text-teal-200" />
        <span>Install App</span>
      </button>

      <PlayStoreInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
