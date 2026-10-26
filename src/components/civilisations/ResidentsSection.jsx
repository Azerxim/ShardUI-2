import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import TitleH2 from "@/components/ui/TitleH2";
import FormModal from "@/components/modals/FormModal";
import PersonnageChip from "@/components/personnages/PersonnageChip";
import { showModalID } from "@/utils/showModal";
import { EMPTY_LIEUX, EMPTY_REFERENTIEL, enregistrerPersonnage, loadLieux, loadReferentiel, personnageFormFields, personnageValeursCreation } from "@/utils/personnages";
import { getPersonnagesOfResidence } from "@/services/api";

const EMPTY_TEXT = {
    civilisation: "Aucun personnage ne vit encore dans cette civilisation.",
    ville: "Aucun personnage ne réside encore dans cette ville.",
    quartier: "Aucun personnage ne réside encore dans ce quartier.",
};

const CREATE_MODAL_ID = "habitant-modal";

// Habitants d'une civilisation, d'une ville ou d'un quartier (résidence choisie par les joueurs sur leurs personnages).
// creation : bouton « Créer » pour le joueur connecté, le nouveau personnage résidant d'office dans ce lieu
export default function ResidentsSection({ type, id, creation = false }) {
    const [fiches, setFiches] = useState([]);
    const [version, setVersion] = useState(0);
    // Formulaire de création : lieux et référentiel chargés à la première ouverture
    const [formulaire, setFormulaire] = useState(null); // { lieux, referentiel, n }

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        getPersonnagesOfResidence(type, id)
            .then((list) => { if (!cancelled) setFiches(Array.isArray(list) ? list : []); })
            .catch((error) => console.error("Error fetching habitants:", error));
        return () => { cancelled = true; };
    }, [type, id, version]);

    useEffect(() => { if (formulaire) showModalID(CREATE_MODAL_ID); }, [formulaire]);

    const ouvrir = async () => {
        const [lieux, referentiel] = formulaire
            ? [formulaire.lieux, formulaire.referentiel]
            : await Promise.all([loadLieux().catch(() => EMPTY_LIEUX), loadReferentiel().catch(() => EMPTY_REFERENTIEL)]);
        setFormulaire((avant) => ({ lieux, referentiel, n: (avant?.n ?? 0) + 1 }));
    };

    const creer = async (values) => {
        const { data, avertissement } = await enregistrerPersonnage(values);
        Swal.fire({ icon: avertissement ? "warning" : "success", title: "Personnage créé", text: avertissement ?? `${data.personnage.name} s'installe ici.` });
        setVersion((v) => v + 1);
    };

    const Fct = creation ? [{
        id: 1, title: "Créer", icon: "fas fa-user-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true,
        tooltip: { text: "Créer un personnage qui réside ici", position: "left" }, function: ouvrir,
    }] : [];

    return (
        <>
            <TitleH2 text="Habitants" icon="fas fa-people-group" aide="personnage" fonctions={Fct} />
            {fiches.length === 0 ? (
                <div className="flex flex-row flex-wrap items-center gap-2 w-full">
                    <i className="flex-1">{EMPTY_TEXT[type]}</i>
                    <a href="/personnages" className="btn btn-sm btn-ghost bg-base-200">Voir les personnages</a>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                    {fiches.map((fiche) => (
                        <PersonnageChip
                            key={fiche.personnage.id}
                            fiche={fiche}
                            detail={[type !== "quartier" ? fiche.quartier?.title : null, type === "civilisation" ? fiche.ville?.title : null, fiche.joueur ? `Joué par ${fiche.joueur.full_name || fiche.joueur.username}` : null].filter(Boolean).join(" · ") || null}
                        />
                    ))}
                </div>
            )}
            {formulaire ? (
                <FormModal
                    key={formulaire.n}
                    id={CREATE_MODAL_ID}
                    title="Créer un personnage"
                    intro="Pas de validation : votre personnage existe dès sa création, et réside déjà ici. Vous pourrez le modifier à tout moment."
                    fields={personnageFormFields(formulaire.lieux, formulaire.referentiel)}
                    initialValues={{ ...personnageValeursCreation(formulaire.referentiel), [`${type}_id`]: String(id) }}
                    submitLabel="Créer"
                    onSubmit={creer}
                />
            ) : null}
        </>
    );
}
