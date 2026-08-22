// PWA registration and install prompt manager

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration failed:', err);
        });
    });
  }
}

let deferredInstallPrompt: any = null;

export function initInstallPromptListener(onPromptAvailable: (available: boolean) => void) {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    onPromptAvailable(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    onPromptAvailable(false);
    console.log('[PWA] SYNCROZZ Link was installed successfully.');
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return false;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return choice.outcome === 'accepted';
}
