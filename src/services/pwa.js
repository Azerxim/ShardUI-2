// ===== Tetrago sur l'écran d'accueil =====
// Service worker (public/sw.js) : enregistré pour le build de production, ou en développement avec
// VITE_SERVICE_WORKER=true. Invitation à installer (beforeinstallprompt, Chrome, Edge, Android) gardée pour le bouton
// « Installer l'application » ; Safari (iPhone) n'en a pas : voir le guide « Installer Tetrago » de /aides.
import { useEffect, useState, useSyncExternalStore } from "react";

export const PWA_EVENT = "tetrago:pwa";
let invitation = null;

export function installerPwa() {
  if (!("serviceWorker" in navigator)) return;
  if (!(import.meta.env.PROD || import.meta.env.VITE_SERVICE_WORKER === "true")) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Service worker non enregistré :", error));
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    invitation = event;
    window.dispatchEvent(new Event(PWA_EVENT));
  });
  window.addEventListener("appinstalled", () => {
    invitation = null;
    window.dispatchEvent(new Event(PWA_EVENT));
  });
}

// Fiches gardées pour la consultation hors ligne : effacées à la déconnexion (elles peuvent contenir des écrits privés)
export function viderCacheApi() {
  navigator.serviceWorker?.controller?.postMessage({ type: "vider-api" });
}

const abonnerInvitation = (rappel) => {
  window.addEventListener(PWA_EVENT, rappel);
  return () => window.removeEventListener(PWA_EVENT, rappel);
};

// Proposer l'installation : null quand le navigateur ne le permet pas (déjà installé, Safari, Firefox…)
export function useInstallation() {
  const disponible = useSyncExternalStore(abonnerInvitation, () => invitation !== null);
  if (!disponible) return null;
  return async () => {
    const evenement = invitation;
    invitation = null;
    window.dispatchEvent(new Event(PWA_EVENT));
    await evenement.prompt();
  };
}

// Connexion au réseau, suivie en direct
export function useEnLigne() {
  const [enLigne, setEnLigne] = useState(() => navigator.onLine);
  useEffect(() => {
    const changer = () => setEnLigne(navigator.onLine);
    window.addEventListener("online", changer);
    window.addEventListener("offline", changer);
    return () => {
      window.removeEventListener("online", changer);
      window.removeEventListener("offline", changer);
    };
  }, []);
  return enLigne;
}
