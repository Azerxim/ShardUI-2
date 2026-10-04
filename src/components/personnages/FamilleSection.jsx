import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import TitleH2 from "@/components/ui/TitleH2";
import FormModal from "@/components/modals/FormModal";
import PersonnageAvatar from "@/components/personnages/PersonnageAvatar";
import BlasonMaison from "@/components/personnages/BlasonMaison";

import { showModalID } from "@/utils/showModal";
import { isModerateur, runAction } from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import { RELATIONS, corpsLien, dateRp, texteDemande, vieRp } from "@/config/lignees";
import {
    createLienParente, deleteLienParente, getDemandesParente, getFamille, getMaisons, getPersonnages, rejoindreMaison,
    repondreLienParente, retirerMembreMaison,
} from "@/services/api";

// ===== Famille d'un personnage =====
// Maison, parents, conjoints, enfants, fratrie et héritiers (Shard-API crud_lignees). Le joueur du personnage ajoute des
// liens ; vers le personnage d'un autre joueur, le lien attend l'accord de celui-ci (demandes affichées ici).

const MODAL_ID = "lien-parente-modal";

function Proche({ personnage, detail, retirer }) {
    const vie = vieRp(personnage);
    return (
        <li className="flex flex-row items-center gap-2 bg-base-100 rounded-2xl pl-1 pr-2 py-1 min-w-0">
            <PersonnageAvatar personnage={personnage} size="sm" />
            <span className="flex flex-col min-w-0">
                <a href={`/personnage/${personnage.id}`} className="link link-hover font-semibold truncate">{personnage.name}</a>
                {(vie || detail) && <span className="text-xs opacity-60 truncate">{[vie, detail].filter(Boolean).join(" · ")}</span>}
            </span>
            {retirer && (
                <button type="button" onClick={retirer} aria-label={`Retirer le lien avec ${personnage.name}`} className="btn btn-xs btn-ghost btn-circle text-error ml-auto">
                    <FontAwesomeIcon icon="fa-solid fa-xmark" />
                </button>
            )}
        </li>
    );
}

export function DemandesParente({ demandes, reload, personnageId = null }) {
    // Reçues (à accepter ou refuser) et envoyées (en attente) ; personnageId : seulement celles qui le concernent
    const concerne = (lien) => personnageId == null || lien.source?.id === personnageId || lien.cible?.id === personnageId;
    const recues = demandes.recues.filter(concerne);
    const envoyees = demandes.envoyees.filter(concerne);
    if (recues.length + envoyees.length === 0) return null;

    const repondre = async (lien, accepter) => {
        if (await runAction(() => repondreLienParente(lien.id, accepter))) reload();
    };
    const annuler = async (lien) => {
        if (await runAction(() => deleteLienParente(lien.id), { confirm: { title: "Annuler cette demande ?", button: "Annuler la demande" } })) reload();
    };

    return (
        <section aria-label="Demandes de parenté" className="flex flex-col gap-2 w-full bg-warning/10 border border-warning/40 rounded-2xl p-3">
            <span className="font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon="fa-solid fa-envelope-open-text" />
                Demandes de parenté
            </span>
            {recues.map((lien) => (
                <div key={lien.id} className="flex flex-row flex-wrap items-center gap-2 text-sm">
                    <span className="flex-1 min-w-48">
                        <strong>{texteDemande(lien)}</strong>
                        {lien.date_rp ? ` · ${dateRp(lien.date_rp)}` : ""}
                        <span className="opacity-70"> — demandé par {lien.demande_par?.full_name || lien.demande_par?.username || "un joueur"}</span>
                    </span>
                    <button type="button" className="btn btn-xs btn-success" onClick={() => repondre(lien, true)}>Accepter</button>
                    <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => repondre(lien, false)}>Refuser</button>
                </div>
            ))}
            {envoyees.map((lien) => (
                <div key={lien.id} className="flex flex-row flex-wrap items-center gap-2 text-sm">
                    <span className="flex-1 min-w-48">
                        {texteDemande(lien)} <span className="opacity-70">— en attente de l'accord de l'autre joueur</span>
                    </span>
                    <button type="button" className="btn btn-xs btn-ghost" onClick={() => annuler(lien)}>Annuler</button>
                </div>
            ))}
        </section>
    );
}

export default function FamilleSection({ personnage, canManage }) {
    const user = getSessionUser();
    const moderateur = isModerateur(user);
    const [famille, setFamille] = useState(null);
    const [demandes, setDemandes] = useState({ recues: [], envoyees: [] });
    const [autres, setAutres] = useState([]);
    const [reloadKey, setReloadKey] = useState(0);
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        getFamille(personnage.id).then(setFamille).catch(() => setFamille(null));
        if (user) getDemandesParente().then(setDemandes).catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personnage.id, reloadKey]);

    // Personnages qu'on peut lier à celui-ci (tous les autres)
    useEffect(() => {
        if (!canManage && !moderateur) return;
        getPersonnages()
            .then((liste) => setAutres((Array.isArray(liste) ? liste : [])
                .filter(({ personnage: p }) => p.id !== personnage.id)
                .map(({ personnage: p, joueur }) => ({ value: p.id, label: `${p.name}${joueur ? ` (joué par ${joueur.full_name || joueur.username})` : ""}` }))))
            .catch(() => { });
    }, [canManage, moderateur, personnage.id]);

    const reload = () => setReloadKey((key) => key + 1);
    const gerer = canManage || moderateur;

    const retirer = (entree, autre) => async () => {
        const result = await runAction(() => deleteLienParente(entree.lien_id), {
            confirm: { title: `Retirer le lien avec ${autre.name} ?`, text: "Il disparaît des deux fiches et de l'arbre de leur maison.", button: "Retirer" },
        });
        if (result) reload();
    };

    const lier = async (values) => {
        const corps = { ...corpsLien(values.relation, personnage.id, Number(values.autre)), date_rp: values.date_rp || null };
        if (values.relation === "heritier" && values.rang) corps.rang = Number.parseInt(values.rang, 10);
        const data = await createLienParente(corps);
        Swal.fire({ icon: "success", title: data.text });
        reload();
    };

    const rejoindre = async () => {
        const maisons = await getMaisons().catch(() => []);
        if (!maisons.length) {
            Swal.fire({ icon: "info", title: "Aucune maison", text: "Fondez la première depuis la page des maisons." });
            return;
        }
        const answer = await Swal.fire({
            icon: "question",
            title: `Faire entrer ${personnage.name} dans une maison`,
            input: "select",
            inputOptions: new Map(maisons.map((maison) => [String(maison.id), maison.title])),
            showCancelButton: true,
            confirmButtonText: "Entrer",
            cancelButtonText: "Annuler",
        });
        if (answer.isConfirmed && await runAction(() => rejoindreMaison(Number(answer.value), personnage.id))) reload();
    };

    const quitter = async () => {
        const result = await runAction(() => retirerMembreMaison(famille.maison.id, personnage.id), {
            confirm: { title: `${personnage.name} quitte la maison ${famille.maison.title} ?`, button: "Quitter" },
        });
        if (result) reload();
    };

    useEffect(() => { if (formKey) showModalID(MODAL_ID); }, [formKey]);
    const ouvrirLien = () => setFormKey((key) => key + 1);

    const groupe = (titre, icon, entrees, detail) => (entrees.length === 0 ? null : (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold flex items-center gap-2 opacity-80">
                <FontAwesomeIcon icon={icon} />
                {titre}
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {entrees.map((entree) => {
                    const proche = entree.personnage ?? entree;
                    return <Proche key={proche.id} personnage={proche} detail={detail?.(entree)} retirer={gerer && entree.lien_id ? retirer(entree, proche) : null} />;
                })}
            </ul>
        </div>
    ));

    const vide = famille && ["parents", "conjoints", "enfants", "fratrie", "heritiers", "heritier_de"].every((cle) => famille[cle].length === 0);

    return (
        <>
            <TitleH2
                text="Famille"
                icon="fas fa-sitemap"
                fonctions={[{ id: 1, title: "Lier", icon: "fas fa-link", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: gerer, tooltip: { text: "Ajouter un parent, un enfant, un conjoint ou un héritier", position: "left" }, function: ouvrirLien }]}
            />
            <div id="famille" className="flex flex-col gap-3 w-full bg-base-200 rounded-3xl p-4 scroll-mt-24">
                {canManage && <DemandesParente demandes={demandes} reload={reload} personnageId={personnage.id} />}
                {famille === null ? (
                    <span className="loading loading-spinner"></span>
                ) : (
                    <>
                        <div className="flex flex-row flex-wrap items-center gap-2">
                            {famille.maison ? (
                                <a href={`/maison/${famille.maison.id}`} className="flex items-center gap-2 link link-hover font-semibold">
                                    <BlasonMaison maison={famille.maison} size="sm" />
                                    Maison {famille.maison.title}
                                </a>
                            ) : <span className="opacity-70">Sans maison</span>}
                            {canManage && famille.maison?.chef_id !== personnage.id && (famille.maison ? (
                                <button type="button" className="btn btn-xs btn-ghost" onClick={quitter}>Quitter la maison</button>
                            ) : (
                                <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={rejoindre}>Entrer dans une maison</button>
                            ))}
                        </div>
                        {groupe("Parents", "fa-solid fa-person-breastfeeding", famille.parents)}
                        {groupe("Conjoints", "fa-solid fa-ring", famille.conjoints, (e) => (e.date_rp ? `marié le ${dateRp(e.date_rp)}` : null))}
                        {groupe("Enfants", "fa-solid fa-child", famille.enfants)}
                        {groupe("Frères et sœurs", "fa-solid fa-people-arrows", famille.fratrie)}
                        {groupe("Héritiers", "fa-solid fa-scroll", famille.heritiers, (e) => (e.rang ? `rang ${e.rang}` : null))}
                        {groupe("Hérite de", "fa-solid fa-hand-holding-heart", famille.heritier_de, (e) => (e.rang ? `rang ${e.rang}` : null))}
                        {vide && <p className="text-sm opacity-70">Aucun lien de parenté n'est encore connu.{gerer ? " « Lier » ajoute un parent, un enfant, un conjoint ou un héritier." : ""}</p>}
                    </>
                )}
            </div>

            {gerer ? (
                <FormModal
                    key={`${MODAL_ID}-${formKey}`}
                    id={MODAL_ID}
                    title={`Lier ${personnage.name}`}
                    intro="Vers le personnage d'un autre joueur, le lien attend son accord."
                    fields={[
                        { name: "relation", label: "L'autre personnage est", type: "select", required: true, options: Object.entries(RELATIONS).map(([value, { label }]) => ({ value, label: `${label} ${personnage.name}` })) },
                        { name: "autre", label: "Personnage", type: "select", required: true, options: autres, empty: "Aucun autre personnage." },
                        { name: "date_rp", label: "Date RP", type: "date", help: "Facultative : mariage, désignation de l'héritier…" },
                        { name: "rang", label: "Rang de succession", type: "number", placeholder: "1", help: "Seulement pour un héritier : 1 hérite d'abord." },
                    ]}
                    initialValues={{ relation: "", autre: "", date_rp: "", rang: "" }}
                    submitLabel="Lier"
                    onSubmit={lier}
                />
            ) : null}
        </>
    );
}
