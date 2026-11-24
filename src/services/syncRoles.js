import { useEffect, useState } from "react";

import { SESSION_EVENT, getSessionUser, rolesDe, syncSessionUser } from "@/services/session";
import { viderCacheApi } from "@/services/pwa";

// ===== Rôles pris en compte sans recharger =====
// Réaligne le profil sur l'API toutes les minutes et au retour sur l'onglet (au plus une fois par RELANCE_MS). Quand les
// rôles du site changent (administrateur, modérateur RP, compte désactivé, connexion ou déconnexion dans un autre
// onglet), la page en cours est remontée : ses droits et ses boutons sont recalculés comme après un rechargement, sans en
// être un. Le remontage attend qu'aucune modale ni alerte ne soit ouverte, pour ne pas perdre une saisie en cours.
// Les autres changements du profil (pseudo, image) ne remontent rien : useSessionUser les suit.
const INTERVALLE_MS = 60_000;
const RELANCE_MS = 10_000;
const ATTENTE_MS = 1_000;
const ANNONCE_MS = 8_000;

const ROLE_LIBELLES = { is_admin: "administrateur du site", is_moderateur: "modérateur RP" };

// Phrase du changement : « Vous êtes désormais modérateur RP. », « Vous n'êtes plus administrateur du site. »
const phraseRoles = (avant, apres) => Object.entries(ROLE_LIBELLES)
  .filter(([role]) => Boolean(avant?.[role]) !== Boolean(apres?.[role]))
  .map(([role, libelle]) => (apres?.[role] ? `Vous êtes désormais ${libelle}.` : `Vous n'êtes plus ${libelle}.`))
  .join(" ");

// Modale (DynamicModal, FormModal) ou alerte SweetAlert ouverte : le remontage attendra
const saisieEnCours = () => Boolean(document.querySelector("dialog[open], .swal2-container"));

// { version : clé des routes (change quand la page doit être remontée), annonce : phrase à afficher ou null }
export function useVersionRoles() {
  const [version, setVersion] = useState(0);
  const [annonce, setAnnonce] = useState(null);

  useEffect(() => {
    let derniere = 0;
    let attente = null;
    let fermeture = null;
    const synchroniser = (force = false) => {
      if (!force && Date.now() - derniere < RELANCE_MS) return;
      derniere = Date.now();
      syncSessionUser();
    };

    const remonter = () => {
      window.clearTimeout(attente);
      if (saisieEnCours()) {
        attente = window.setTimeout(remonter, ATTENTE_MS);
        return;
      }
      setVersion((v) => v + 1);
    };

    // Rôles et compte connus : comparés après chaque changement du profil, ici ou dans un autre onglet (« storage »)
    let connu = getSessionUser();
    const surChangement = () => {
      const actuel = getSessionUser();
      const avant = connu;
      connu = actuel;
      if (avant?.id === actuel?.id && rolesDe(avant) === rolesDe(actuel)) return;
      // Déconnexion ou autre compte : les fiches gardées hors ligne (écrits privés compris) sont effacées
      if (avant && avant.id !== actuel?.id) viderCacheApi();
      remonter();
      // Rôle accordé ou retiré pendant la visite (même compte) : on le dit
      const phrase = avant && actuel && avant.id === actuel.id ? phraseRoles(avant, actuel) : "";
      if (phrase) {
        setAnnonce(phrase);
        window.clearTimeout(fermeture);
        fermeture = window.setTimeout(() => setAnnonce(null), ANNONCE_MS);
      }
    };

    const auRetour = () => {
      if (document.visibilityState === "visible") synchroniser();
    };

    const minuterie = window.setInterval(() => {
      if (document.visibilityState === "visible") synchroniser(true);
    }, INTERVALLE_MS);
    window.addEventListener(SESSION_EVENT, surChangement);
    window.addEventListener("storage", surChangement);
    window.addEventListener("focus", auRetour);
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      window.clearInterval(minuterie);
      window.clearTimeout(attente);
      window.clearTimeout(fermeture);
      window.removeEventListener(SESSION_EVENT, surChangement);
      window.removeEventListener("storage", surChangement);
      window.removeEventListener("focus", auRetour);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, []);

  return { version, annonce, fermerAnnonce: () => setAnnonce(null) };
}
