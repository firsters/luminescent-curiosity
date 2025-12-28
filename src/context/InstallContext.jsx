import { createContext, useContext, useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const InstallContext = createContext();

export function useInstallPrompt() {
  return useContext(InstallContext);
}

export function InstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // PWA Update Logic (Centralized)
  const [swRegistration, setSwRegistration] = useState(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker: updateSW,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
      setSwRegistration(r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const checkForUpdates = async () => {
    if (swRegistration) {
      console.log("Checking for SW updates manually...");
      await swRegistration.update();
    }
  };

  const updateServiceWorker = async (reloadPage = true) => {
    console.log("updateServiceWorker called, reloading:", reloadPage);
    await updateSW(reloadPage);
  };

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(ios);

    // Detect Standalone (already installed)
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Capture install prompt
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      console.log("beforeinstallprompt captured in InstallContext");
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const clearPrompt = () => {
    setDeferredPrompt(null);
  };

  const value = {
    deferredPrompt,
    clearPrompt,
    isIos,
    isStandalone,
    // PWA Update State
    offlineReady,
    needRefresh,
    updateServiceWorker,
    checkForUpdates,
    setOfflineReady,
    setNeedRefresh,
  };

  return (
    <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
  );
}
