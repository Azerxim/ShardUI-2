import { useEffect } from "react";

import Navbar from "@/components/layout/Navbar";
import DynamicNavbar from "@/components/layout/DynamicNavbar";
import CodexContenu from "@/components/codex/CodexContenu";
import CodexPageLaunch from "@/pages/codex/CodexPageLaunch";
import { lancementAVenir } from "@/config/saison";
import { marquerCodexLu } from "@/utils/parcours";

// Contenu du Codex : config/codex.js ; mise en page et navigation : components/codex/CodexContenu.jsx

export default function CodexPage() {
  // Coche l'étape « Lisez le Codex » du parcours de l'accueil
  useEffect(marquerCodexLu, []);

  // Codex de l'annonce tant que VITE_SAISON_LANCEMENT annonce la saison à venir (config/saison.js)
  if (lancementAVenir()) return <CodexPageLaunch />;
  return <CodexSaison />;
}

function CodexSaison() {
  return (
    <>
      <Navbar active="codex" />
      <div className="bg-base-100">
        <main className="container mx-auto p-4">
          <CodexContenu apresHero={<DynamicNavbar active_id="codex" />} />
        </main>
      </div>
    </>
  );
}
