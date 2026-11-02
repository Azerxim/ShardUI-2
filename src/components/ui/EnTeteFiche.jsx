import FilAriane from "@/components/ui/FilAriane";
import TitleButtons from "@/components/ui/TitleButtons";
import { encreSur } from "@/utils/couleurFiche";

// ===== En-tête d'une fiche (charte « Chancellerie + Héraldique ») =====
// Un aplat aux couleurs de l'élément, son emblème (blason, médaillon, couverture…), le titre en Almendra, une devise et
// quelques informations ; le texte passe en encre ou en blanc selon la couleur. Le fil d'Ariane est au-dessus.
// fonctions : boutons d'action, comme pour TitleH1 (visibles selon les droits, voir TitleButtons) ;
// infos : contenu libre sous la devise (InfoLine…), dans la couleur du texte de l'en-tête ;
// children : une rangée sous le titre, sur toute la largeur de l'en-tête (les camps d'une guerre).
export default function EnTeteFiche({ couleur, embleme = null, surtitre = null, titre, devise = null, infos = null, fonctions = [], ariane = null, children = null }) {
    const encre = encreSur(couleur);
    // Boutons d'action : voile clair sur un fond sombre, voile sombre sur un fond clair
    const voile = encre === "#ffffff" ? "bg-white/15 hover:bg-white/25" : "bg-black/10 hover:bg-black/20";
    const boutons = fonctions.map((fonction) => ({ ...fonction, class: voile }));

    return (
        <div className="flex flex-col gap-1 w-full min-w-0">
            {ariane ? <FilAriane items={ariane} /> : null}
            <header className="w-full rounded-3xl px-5 py-6 md:px-10 md:py-7" style={{ background: couleur, color: encre }}>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 sm:gap-6">
                    {embleme}
                    <div className="flex flex-col gap-1 flex-1 min-w-0 sm:min-w-80">
                        {surtitre ? <span className="font-label text-sm md:text-base opacity-85">{surtitre}</span> : null}
                        <h1 className="text-3xl md:text-5xl leading-tight break-words">{titre}</h1>
                        {devise ? <span className="italic text-lg opacity-90 break-words">« {devise} »</span> : null}
                        {infos ? <div className="flex flex-row flex-wrap gap-x-5 gap-y-1 mt-1 text-sm md:text-base">{infos}</div> : null}
                    </div>
                    <TitleButtons fonctions={boutons} />
                </div>
                {children ? <div className="mt-6">{children}</div> : null}
            </header>
        </div>
    );
}
