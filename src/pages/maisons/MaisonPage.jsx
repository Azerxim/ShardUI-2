import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import InfoLine from "@/components/ui/InfoLine";
import FormModal from "@/components/modals/FormModal";
import BlasonMaison from "@/components/personnages/BlasonMaison";
import PersonnageAvatar from "@/components/personnages/PersonnageAvatar";
import ArbreMaison from "@/components/lignees/ArbreMaison";

import { usePageTitle } from "@/utils/pageTitle";
import { showModalID } from "@/utils/showModal";
import { isModerateur, runAction } from "@/utils/conflits";
import { plural } from "@/utils/plural";
import { getSessionUser } from "@/services/session";
import { dateRp, vieRp } from "@/config/lignees";
import { deleteMaison, getCivilisations, getMaison, getPersonnagesOfUser, rejoindreMaison, retirerMembreMaison, updateMaison } from "@/services/api";
import { maisonChamps, maisonCorps, maisonValeurs } from "@/pages/maisons/maisonForm";

// ===== Fiche d'une maison noble =====
// Blason, devise, chef, membres et arbre de la lignée (Shard-API crud_lignees). Chaque joueur y fait entrer ou sortir
// ses personnages ; le chef, le fondateur de la maison et les modérateurs RP la gèrent (chef, blason, exclusions).

const EDIT_MODAL_ID = "maison-edit-modal";

export default function MaisonPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [mesPersonnages, setMesPersonnages] = useState([]);
    const [civilisations, setCivilisations] = useState([]);

    const maison = data?.maison;
    usePageTitle(maison ? `Maison ${maison.title}` : null);

    useEffect(() => {
        getMaison(id)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    useEffect(() => {
        if (!user) return;
        getPersonnagesOfUser(user.id).then((liste) => setMesPersonnages((Array.isArray(liste) ? liste : []).map((item) => item.personnage))).catch(() => { });
        getCivilisations()
            .then((liste) => setCivilisations((Array.isArray(liste) ? liste : []).map((item) => item.civilisation).filter((civ) => civ.is_public !== false)
                .map((civ) => ({ value: civ.id, label: civ.title })).sort((a, b) => a.label.localeCompare(b.label))))
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reload = () => setReloadKey((key) => key + 1);
    const membres = data?.membres ?? [];
    const canManage = Boolean(user && maison && (isModerateur(user) || maison.created_by === user.id || maison.chef?.user_id === user.id));
    const aFaireEntrer = mesPersonnages.filter((p) => p.maison_id !== maison?.id);

    const faireEntrer = async () => {
        if (aFaireEntrer.length === 0) {
            Swal.fire({ icon: "info", title: "Aucun personnage à faire entrer", text: "Tous vos personnages sont déjà membres de la maison, ou vous n'en avez pas encore." });
            return;
        }
        const answer = await Swal.fire({
            icon: "question",
            title: `Entrer dans la maison ${maison.title}`,
            text: "Un personnage déjà membre d'une autre maison la quitte.",
            input: "select",
            inputOptions: new Map(aFaireEntrer.map((p) => [String(p.id), p.name])),
            showCancelButton: true,
            confirmButtonText: "Entrer",
            cancelButtonText: "Annuler",
        });
        if (answer.isConfirmed && await runAction(() => rejoindreMaison(maison.id, Number(answer.value)))) reload();
    };

    const retirer = async (membre) => {
        const sien = membre.user_id === user?.id;
        const result = await runAction(() => retirerMembreMaison(maison.id, membre.id), {
            confirm: { title: sien ? `${membre.name} quitte la maison ?` : `Exclure ${membre.name} de la maison ?`, text: "Ses liens de parenté restent sur sa fiche.", button: sien ? "Quitter" : "Exclure" },
        });
        if (result) reload();
    };

    const enregistrer = async (values) => {
        const data = await updateMaison(maison.id, maisonCorps(values));
        Swal.fire({ icon: "success", title: data.text });
        reload();
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: canManage, function: () => showModalID(EDIT_MODAL_ID) },
        {
            id: 2, title: "Dissoudre", icon: "fas fa-trash", class: "bg-base-200 hover:bg-base-300 text-error", connected: true, authorisation: canManage,
            function: async () => {
                const result = await runAction(() => deleteMaison(maison.id), {
                    confirm: { title: `Dissoudre la maison ${maison.title} ?`, text: "Ses membres redeviennent sans maison ; leurs liens de parenté sont conservés.", button: "Dissoudre" },
                });
                if (result) navigate("/maisons");
            },
        },
    ];
    const FctMembres = [
        { id: 1, title: "Faire entrer", icon: "fas fa-user-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, tooltip: { text: "Faire entrer un de vos personnages", position: "left" }, function: faireEntrer },
    ];
    const btnReturn = { text: "Retour aux maisons", icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: "/maisons" };

    return (
        <>
            <Navbar active="maisons" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !maison ? (
                        <>
                            <TitleH1 text="Maison introuvable" icon="fas fa-chess-king" btn={btnReturn} />
                            <p>Cette maison n'existe pas ou a été dissoute.</p>
                        </>
                    ) : (
                        <>
                            <TitleH1 text={`Maison ${maison.title}`} icon="fas fa-chess-king" btn={btnReturn} fonctions={FctModify} ariane={[{ label: "Maisons", href: "/maisons" }, { label: maison.title }]} />

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full bg-base-200 rounded-3xl p-4">
                                <BlasonMaison maison={maison} size="xl" />
                                <div className="flex flex-col gap-1 min-w-0">
                                    {maison.devise && <p className="italic text-lg break-words">« {maison.devise} »</p>}
                                    <InfoLine icon="fa-solid fa-crown">
                                        {maison.chef ? <>Chef : <a href={`/personnage/${maison.chef.id}`} className="link link-hover font-semibold">{maison.chef.name}</a></> : "Pas de chef désigné"}
                                    </InfoLine>
                                    {maison.civilisation && (
                                        <InfoLine icon="fa-solid fa-flag">
                                            <a href={`/civilisation/${maison.civilisation.id}`} className="link link-hover">{maison.civilisation.title}</a>
                                        </InfoLine>
                                    )}
                                    {maison.date_fondation && <InfoLine icon="fa-solid fa-hourglass-start">Fondée le {dateRp(maison.date_fondation)}</InfoLine>}
                                    {maison.description && <p className="text-sm opacity-80 whitespace-pre-line break-words mt-1">{maison.description}</p>}
                                </div>
                            </div>

                            <TitleH2 text="Arbre de la lignée" icon="fas fa-sitemap" />
                            <div className="w-full bg-base-200 rounded-3xl p-4 overflow-x-auto">
                                {membres.length === 0 ? (
                                    <p className="opacity-70">La maison n'a encore aucun membre.</p>
                                ) : (
                                    <ArbreMaison membres={membres} allies={data.allies} liens={data.liens} chefId={maison.chef_id} />
                                )}
                                <p className="text-xs opacity-60 mt-3">Les liens de parenté s'ajoutent sur la fiche de chaque personnage, section « Famille ». En pointillés : les conjoints venus d'autres maisons.</p>
                            </div>

                            <TitleH2 text={`Membres (${membres.length})`} icon="fas fa-users" fonctions={FctMembres} />
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                                {membres.map((membre) => (
                                    <li key={membre.id} className="flex flex-row items-center gap-2 bg-base-200 rounded-2xl p-2 min-w-0">
                                        <PersonnageAvatar personnage={membre} size="md" />
                                        <span className="flex flex-col min-w-0 flex-1">
                                            <a href={`/personnage/${membre.id}`} className="link link-hover font-semibold truncate">{membre.name}</a>
                                            <span className="text-xs opacity-60">{[membre.id === maison.chef_id ? "Chef" : null, vieRp(membre)].filter(Boolean).join(" · ")}</span>
                                        </span>
                                        {membre.id !== maison.chef_id && (canManage || membre.user_id === user?.id) && (
                                            <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => retirer(membre)}>
                                                {membre.user_id === user?.id ? "Quitter" : "Exclure"}
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm opacity-70 w-full px-1">{plural(data.allies.length, "allié")} par mariage.</p>
                        </>
                    )}

                    {maison && canManage ? (
                        <FormModal
                            key={`${EDIT_MODAL_ID}-${reloadKey}`}
                            id={EDIT_MODAL_ID}
                            title={`Modifier la maison ${maison.title}`}
                            fields={maisonChamps({ chefs: membres.map((m) => ({ value: m.id, label: m.name })), civilisations })}
                            initialValues={maisonValeurs(maison)}
                            submitLabel="Enregistrer"
                            onSubmit={enregistrer}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
