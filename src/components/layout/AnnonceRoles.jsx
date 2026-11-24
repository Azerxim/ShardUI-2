import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Annonce d'un rôle accordé ou retiré, en bas de l'écran (pas une alerte SweetAlert : elle remplacerait celle en cours)
export default function AnnonceRoles({ annonce, onClose }) {
  if (!annonce) return null;
  return (
    <div role="status" className="fixed bottom-16 right-3 z-50 flex items-start gap-3 bg-base-100 text-base-content rounded-3xl px-4 py-3 shadow-xl border border-base-300 max-w-[min(24rem,calc(100vw-1.5rem))]">
      <FontAwesomeIcon icon="fa-solid fa-user-shield" className="text-info mt-1" />
      <div className="flex flex-col">
        <strong>Vos rôles ont changé</strong>
        <span className="text-sm">{annonce}</span>
      </div>
      <button type="button" onClick={onClose} className="btn btn-ghost btn-xs btn-circle" aria-label="Fermer">
        <FontAwesomeIcon icon="fa-solid fa-xmark" />
      </button>
    </div>
  );
}
