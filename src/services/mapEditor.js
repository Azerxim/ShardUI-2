const mapsURL = import.meta.env.VITE_MAPS_BASE_URL || "https://map.beta.tetrago.fr";
const mapsOrigin = new URL(mapsURL).origin;

// Ouvre l'éditeur de ShardUI-2-Maps sur une civilisation (marqueurs), une ville ou un quartier (frontières), ou une
// guerre (zones de conflit). La connexion de l'éditeur est assurée par installMapEditorAuth (main.jsx).
export function openMapEditor({ dimension, type, id, x = 0, z = 0, zoom = 0 }) {
  const url = `${mapsURL}/${dimension.link}-editor-civilisations?${type}=${id}#x=${x}&z=${z}&zoom=${zoom}`;
  return Boolean(window.open(url, "_blank"));
}

// Connexion de l'éditeur : les deux applications n'ont pas le même localStorage (origines différentes). L'éditeur
// demande le jeton par postMessage, à plusieurs reprises tant qu'il n'a pas de réponse. Cet onglet répond :
//  - à toute fenêtre qu'il a ouverte, même après une navigation ou un rechargement (window.opener désigne toujours
//    cet onglet), avec le jeton courant (une reconnexion sur le site est donc reprise par l'éditeur) ;
//  - seulement si elle est servie depuis l'origine de la carte (VITE_MAPS_BASE_URL) ; sinon l'éditeur est prévenu.
let installed = false;

export function installMapEditorAuth() {
  if (installed) return;
  installed = true;

  window.addEventListener("message", (event) => {
    if (event.data?.source !== "minedmap" || event.data?.type !== "editor-auth-request" || !event.source) return;

    let openedHere;
    try {
      openedHere = event.source.opener === window;
    } catch {
      openedHere = false;
    }
    if (!openedHere) return;

    if (event.origin !== mapsOrigin) {
      console.warn(`Éditeur de carte : origine ${event.origin} inattendue (VITE_MAPS_BASE_URL = ${mapsURL})`);
      event.source.postMessage(
        { source: "shardui", type: "editor-auth-refused", reason: `Ce site attend l'éditeur de carte sur ${mapsOrigin} (VITE_MAPS_BASE_URL), pas sur ${event.origin}` },
        event.origin
      );
      return;
    }

    event.source.postMessage({ source: "shardui", type: "editor-auth", token: localStorage.getItem("token") }, mapsOrigin);
  });
}
