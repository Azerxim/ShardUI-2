import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useEnLigne } from "@/services/pwa";

// Bandeau hors ligne : le service worker (public/sw.js) sert les fiches déjà consultées sur cet appareil
export default function HorsLigne() {
  const enLigne = useEnLigne();
  if (enLigne) return null;
  return (
    <div role="status" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-encre text-os rounded-3xl px-4 py-2 text-sm shadow-xl max-w-[calc(100vw-1.5rem)]">
      <FontAwesomeIcon icon="fa-solid fa-plug-circle-xmark" />
      <span>Hors ligne : vous relisez les pages déjà consultées sur cet appareil.</span>
    </div>
  );
}
