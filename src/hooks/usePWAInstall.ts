import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'prompted' | 'accepted' | 'dismissed' | 'unsupported'>('idle');

  useEffect(() => {
    // Detect iframe
    try {
      setIsInIframe(window.top !== window.self);
    } catch {
      setIsInIframe(true);
    }

    // Detect standalone mode (already installed as PWA / Play Store TWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const android = /android/.test(userAgent);
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const windows = /win/.test(userAgent);
    const mac = /macintosh|mac os x/.test(userAgent) && !ios;
    const desktop = !android && !ios;

    setIsAndroid(android);
    setIsIOS(ios);
    setIsWindows(windows);
    setIsMac(mac);
    setIsDesktop(desktop);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallStatus('accepted');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<{ success: boolean; reason?: string }> => {
    if (!deferredPrompt) {
      setInstallStatus('unsupported');
      return {
        success: false,
        reason: isInIframe
          ? 'iFrame Restricted: Browsers disable direct install prompts inside embedded frames. Open in a dedicated window or use the 1-Click Desktop Launcher.'
          : 'Prompt Unavailable: Your browser has not fired the install prompt yet. You can install via the browser address bar (⊕ icon) or browser menu (Apps > Install).'
      };
    }
    try {
      setInstallStatus('prompted');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setInstallStatus('accepted');
        return { success: true };
      } else {
        setInstallStatus('dismissed');
        return { success: false, reason: 'Install prompt was dismissed by the user.' };
      }
    } catch (err: any) {
      console.warn('PWA install prompt error:', err);
      setInstallStatus('unsupported');
      return { success: false, reason: err?.message || 'Install prompt error occurred.' };
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isAndroid,
    isIOS,
    isWindows,
    isMac,
    isDesktop,
    isInIframe,
    installStatus,
    install,
    promptEvent: deferredPrompt
  };
}
