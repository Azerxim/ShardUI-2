import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import EtatVide from "@/components/ui/EtatVide";
import FormModal from "@/components/modals/FormModal";
import BlasonMaison from "@/components/personnages/BlasonMaison";

import { showModalID } from "@/utils/showModal";
import { requireLogin } from "@/utils/requireLogin";
import { plural } from "@/utils/plural";
import { getSessionUser } from "@/services/session";
import { dateRp } from "@/config/lignees";
import { createMaison, getCivilisations, getMaisons, getPersonnagesOfUser } from "@/services/api";
import { maisonChamps, maisonCorps, maisonValeurs } from "@/pages/maisons/maisonForm";

// ===== Maisons nobles =====
// Les familles de personnages (Shard-API crud_lignees) : blason, devise, chef, et l'arbre de chacune sur sa fiche.
// Fonder une maison demande d'en désigner le chef parmi ses personnages ; chacun y fait ensuite entrer les siens.

const MODAL_ID = "maison-modal";

function MaisonCard({ maison }) {
    return (
        <a href={`/maison/${maison.id}`} className="flex flex-row items-center gap-4 p-4 bg-base-200 hover:bg-base-300 transition-colors rounded-3xl shadow-md min-w-0">
            <BlasonMaison maison={maison} size="lg" />
            <span className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-xl font-bold break-words">Maison {maison.title}</h2>
                {maison.devise && <span className="italic text-sm opacity-80 break-words">« {maison.devise} »</span>}
                <span className="text-sm opacity-70 flex flex-wrap gap-x-3">
                    {maison.chef && <span><FontAwesomeIcon icon="fa-solid fa-crown" className="mr-1" />{maison.chef.name}</span>}
                    <span>{plural(maison.membres_count, "membre")}</span>
                    {maison.civilisation && <span>{maison.civilisation.title}</span>}
                    {maison.date_fondation && <span>Fondée le {dateRp(maison.date_fondation)}</span>}
                </span>
            </span>
        </a>
    );
}

export default function MaisonsPage() {
    const user = getSessionUser();
    const [maisons, setMaisons] = useState(null);
    const [options, setOptions] = useState({ chefs: [], civilisations: [] });
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        getMaisons().then((data) => setMaisons(Array.isArray(data) ? data : [])).catch(() => setMaisons([]));
        if (!user) return;
        Promise.all([getPersonnagesOfUser(user.id).catch(() => []), getCivilisations().catch(() => [])]).then(([personnages, civilisations]) => setOptions({
            chefs: (Array.isArray(personnages) ? personnages : []).map(({ personnage }) => ({ value: personnage.id, label: personnage.name })),
            civilisations: (Array.isArray(civilisations) ? civilisations : []).map((item) => item.civilisation).filter((civ) => civ.is_public !== false)
                .map((civ) => ({ value: civ.id, label: civ.title })).sort((a, b) => a.label.localeCompare(b.label)),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { if (formKey) showModalID(MODAL_ID); }, [formKey]);

    const fonder = () => requireLogin(() => setFormKey((key) => key + 1), "fonder une maison");

    const enregistrer = async (values) => {
        const data = await createMaison(maisonCorps(values));
        await Swal.fire({ icon: "success", title: data.text });
        window.location.href = `/maison/${data.maison.id}`;
    };

    return (
        <>
            <Navbar active="maisons" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-3">
                    <GrimoireHero
                        icon="fa-solid fa-chess-king"
                        title="Les maisons de Tetrago"
                        description="Les grandes familles du monde : leurs blasons, leurs devises, et l'arbre de leurs lignées, des fondateurs aux héritiers."
                        topRight={
                            <button onClick={fonder} aria-label="Fonder une maison" className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Fonder une maison" style={{ padding: "0.75rem 0.75rem 0.75rem 1.25rem", cursor: "pointer" }}>
                                <span className="flex">Maison</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    <p className="text-sm opacity-70 w-full px-1">
                        Les liens de parenté (parents, conjoints, héritiers) s'ajoutent depuis la fiche de chaque personnage, section « Famille ».
                    </p>
                    {maisons === null ? (
                        <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
                    ) : maisons.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-chess-king"
                            texte="Aucune maison n'a encore été fondée."
                            aide="Choisissez un de vos personnages pour en prendre la tête, un blason et une devise."
                            action={{ label: "Fonder une maison", icon: "fa-solid fa-plus", onClick: fonder }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            {maisons.map((maison) => <MaisonCard key={maison.id} maison={maison} />)}
                        </div>
                    )}

                    {user && formKey > 0 ? (
                        <FormModal
                            key={`${MODAL_ID}-${formKey}`}
                            id={MODAL_ID}
                            title="Fonder une maison"
                            fields={maisonChamps(options)}
                            initialValues={maisonValeurs()}
                            submitLabel="Fonder"
                            onSubmit={enregistrer}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
