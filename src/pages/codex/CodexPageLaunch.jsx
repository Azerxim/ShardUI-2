import NavbarLaunch from "@/components/layout/NavbarLaunch";
import CodexContenu from "@/components/codex/CodexContenu";

// Codex de la page de lancement : même contenu que celui de la saison, avec la barre de navigation allégée
export default function CodexPageLaunch() {
  return (
    <>
      <NavbarLaunch active="codex" />
      <div className="bg-base-100">
        <main className="container mx-auto p-4">
          <CodexContenu />
        </main>
      </div>
    </>
  );
}
