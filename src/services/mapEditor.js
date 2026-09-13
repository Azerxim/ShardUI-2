const mapsURL = import.meta.env.VITE_MAPS_BASE_URL || "https://map.beta.tetrago.fr";

// Ouvre l'éditeur de ShardUI-2-Maps sur une civilisation (marqueurs) ou une
// ville (frontières).
// Les deux applications ne partagent pas le même localStorage (origines
// différentes) : l'éditeur demande le jeton par postMessage à cette fenêtre,
// qui ne répond qu'à la fenêtre ouverte ici et qu'à l'origine de la carte.
export function openMapEditor({ dimension, type, id, x = 0, z = 0, zoom = 0 }) {
  const url = `${mapsURL}/${dimension.link}-editor-civilisations?${type}=${id}#x=${x}&z=${z}&zoom=${zoom}`;
  const editor = window.open(url, "_blank");
  if (!editor) return false;

  const mapsOrigin = new URL(mapsURL).origin;
  const handleMessage = (event) => {
    if (event.origin !== mapsOrigin || event.source !== editor) return;
    if (event.data?.source !== "minedmap" || event.data?.type !== "editor-auth-request") return;

    editor.postMessage(
      { source: "shardui", type: "editor-auth", token: localStorage.getItem("token") },
      mapsOrigin
    );
  };

  window.addEventListener("message", handleMessage);
  const watcher = setInterval(() => {
    if (editor.closed) {
      clearInterval(watcher);
      window.removeEventListener("message", handleMessage);
    }
  }, 2000);
  return true;
}
