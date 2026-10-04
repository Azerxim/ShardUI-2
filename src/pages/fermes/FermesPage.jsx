import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH2 from "@/components/ui/TitleH2";
import EtatVide from "@/components/ui/EtatVide";
import FormModal from "@/components/modals/FormModal";

import { showModalID } from "@/utils/showModal";
import { requireLogin } from "@/utils/requireLogin";
import { isModerateur, runAction } from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import { MAPS_BASE_URL } from "@/config/maps";
import { STATUTS_FERMES, TYPES_FERMES, typeFerme } from "@/config/fermes";
import {
    declarerFerme, deleteFerme, deciderFerme, envoyerPhotoFerme, getDimensions, getFermes, getMesFermes, getVilles,
    photoFermeUrl, updateFerme,
} from "@/services/api";

// ===== Fermes =====
// Codex, « Fermes & ressources » : toute ferme se déclare et s'habille. La déclaration se fait ici (position, production,
// justification RP, bâtiment qui l'habille, photo) ; un modérateur RP la valide ou demande une mise en conformité,
// jamais pour sa propre ferme (Shard-API crud_fermes). Une ferme modifiée par son déclarant repasse en attente.
// Visibilité : le déclarant et les modérateurs RP seulement — une ferme est une position de jeu.

const MODAL_ID = "ferme-modal";

const ETAPES = [
    { icon: "fa-solid fa-file-signature", titre: "Déclarez", texte: "Position, ce qu'elle produit et sa justification RP : qui l'exploite, et pourquoi." },
    { icon: "fa-solid fa-house-chimney", titre: "Habillez", texte: "Moulin, étable, mine, atelier : la ferme se cache dans un bâtiment cohérent. Une photo le montre." },
    { icon: "fa-solid fa-stamp", titre: "Validation", texte: "Un modérateur RP la valide, ou dit ce qu'il faut mettre en conformité. Toute modification la renvoie en examen." },
];

const champs = (villes, ferme) => [
    { name: "title", label: "Nom", type: "text", required: true, placeholder: "Ex. Moulin du Val, Étable de la Garde" },
    { name: "type", label: "Type", type: "select", required: true, options: TYPES_FERMES.map(({ value, label }) => ({ value, label })) },
    // Comme pour les villes : monde et X/Z, la carte suit la saisie et se déplace pour choisir le point (écran large)
    { name: "localisation", label: "Position", type: "localisation", required: true, placeholder: "Monde de la ferme" },
    { name: "y", label: "Coordonnée Y", type: "number", placeholder: "Facultative : hauteur de la ferme" },
    { name: "ville_id", label: "Ville", type: "select", placeholder: "Hors des villes", options: villes.map((ville) => ({ value: ville.id, label: ville.title })) },
    { name: "production", label: "Production", type: "textarea", placeholder: "Ce qu'elle produit, à quel rythme" },
    { name: "justification", label: "Justification RP", type: "textarea", required: true, placeholder: "Qui l'exploite, pour qui, pourquoi" },
    { name: "habillage", label: "Habillage", type: "text", placeholder: "Bâtiment qui la cache : moulin, étable, mine…" },
    { name: "photo", label: ferme?.photo ? "Remplacer la photo" : "Photo", type: "file", accept: "image/png,image/jpeg,image/webp", help: "PNG, JPEG ou WebP, 5 Mo au plus : la ferme vue de l'extérieur." },
];

const valeursInitiales = (ferme, dimensions) => ({
    title: ferme?.title ?? "",
    type: ferme?.type ?? "",
    dimension_id: ferme?.dimension?.id ?? (dimensions.length === 1 ? dimensions[0].id : ""),
    x: ferme?.x != null ? String(ferme.x) : "0",
    y: ferme?.y != null ? String(ferme.y) : "",
    z: ferme?.z != null ? String(ferme.z) : "0",
    ville_id: ferme?.ville?.id ?? "",
    production: ferme?.production ?? "",
    justification: ferme?.justification ?? "",
    habillage: ferme?.habillage ?? "",
    photo: null,
});

const dateCourte = (date) => (date ? new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);
const nom = (user) => user?.full_name || user?.username || "compte supprimé";

function FermeCard({ ferme, actions }) {
    const type = typeFerme(ferme.type);
    const statut = STATUTS_FERMES[ferme.status] ?? STATUTS_FERMES.en_attente;
    const carte = ferme.dimension?.link ? `${MAPS_BASE_URL}/${ferme.dimension.link}-civilisations#x=${ferme.x}&z=${ferme.z}&zoom=1` : null;
    return (
        <article id={`ferme-${ferme.id}`} className="flex flex-col sm:flex-row gap-3 bg-base-200 rounded-2xl p-3 scroll-mt-24 target:ring-2 target:ring-primary">
            {ferme.photo ? (
                <a href={photoFermeUrl(ferme.photo)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img src={photoFermeUrl(ferme.photo)} alt={`Photo de ${ferme.title}`} className="w-full sm:w-48 h-36 object-cover rounded-xl" loading="lazy" />
                </a>
            ) : (
                <div className="hidden sm:flex flex-col items-center justify-center gap-1 w-48 h-36 rounded-xl bg-base-300 text-sm opacity-70 shrink-0">
                    <FontAwesomeIcon icon="fa-solid fa-camera" size="lg" />
                    Pas de photo
                </div>
            )}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex flex-row flex-wrap items-center gap-2">
                    <FontAwesomeIcon icon={type.icon} className="opacity-70" />
                    <strong className="break-words">{ferme.title}</strong>
                    <span className={`badge badge-sm ${statut.badge}`}>
                        <FontAwesomeIcon icon={statut.icon} />
                        {statut.label}
                    </span>
                </div>
                <span className="text-sm opacity-80 flex flex-wrap items-center gap-x-3">
                    <span>{type.label}</span>
                    <span className="tabular-nums">{ferme.dimension ? `${ferme.dimension.title} · ` : ""}X {ferme.x}{ferme.y != null ? ` · Y ${ferme.y}` : ""} · Z {ferme.z}</span>
                    {carte && <a href={carte} target="_blank" rel="noopener noreferrer" className="link link-hover">carte</a>}
                    {ferme.ville && <a href={`/civilisation/${ferme.ville.civilisation_id}/ville/${ferme.ville.id}`} className="link link-hover">{ferme.ville.title}</a>}
                </span>
                {ferme.production && <p className="text-sm"><span className="font-semibold">Production : </span>{ferme.production}</p>}
                <p className="text-sm"><span className="font-semibold">Justification : </span>{ferme.justification}</p>
                {ferme.habillage && <p className="text-sm"><span className="font-semibold">Habillage : </span>{ferme.habillage}</p>}
                {ferme.decision_note && (
                    <p className={`text-sm rounded-lg px-2 py-1 ${ferme.status === "a_corriger" ? "bg-error/10" : "bg-base-100"}`}>
                        <FontAwesomeIcon icon="fa-solid fa-comment" className="opacity-70 mr-1" />
                        {ferme.decision_note}
                    </p>
                )}
                <span className="text-xs opacity-60">
                    Déclarée par {nom(ferme.declarant)} le {dateCourte(ferme.created_at)}
                    {ferme.moderateur && ferme.status !== "en_attente" ? ` · décision de ${nom(ferme.moderateur)} le ${dateCourte(ferme.decision_at)}` : ""}
                </span>
                {actions && <div className="flex flex-row flex-wrap gap-1 mt-1">{actions}</div>}
            </div>
        </article>
    );
}

export default function FermesPage() {
    const user = getSessionUser();
    const moderateur = isModerateur(user);
    const [mesFermes, setMesFermes] = useState(null);
    const [toutes, setToutes] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [villes, setVilles] = useState([]);
    const [edition, setEdition] = useState(null); // { ferme (null : nouvelle), count }
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!user) return;
        getMesFermes().then(setMesFermes).catch(() => setMesFermes([]));
        if (moderateur) getFermes().then(setToutes).catch(() => setToutes([]));
        // moderateur : le rôle peut arriver après le premier rendu (profil resynchronisé par la barre de navigation)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey, moderateur]);

    useEffect(() => {
        getDimensions().then((liste) => setDimensions(Array.isArray(liste) ? liste : [])).catch(() => { });
        getVilles().then((liste) => setVilles((Array.isArray(liste) ? liste : []).filter((ville) => ville.is_public !== false).sort((a, b) => a.title.localeCompare(b.title)))).catch(() => { });
    }, []);

    useEffect(() => { if (edition) showModalID(MODAL_ID); }, [edition]);

    // Lien d'une annonce Discord (#ferme-12) : on descend jusqu'à la ferme une fois la liste affichée
    useEffect(() => {
        const cible = decodeURIComponent(window.location.hash.slice(1));
        if (cible && (mesFermes || toutes.length)) requestAnimationFrame(() => document.getElementById(cible)?.scrollIntoView({ block: "start" }));
    }, [mesFermes, toutes]);

    const reload = () => setReloadKey((key) => key + 1);
    const ouvrir = (ferme = null) => setEdition((prev) => ({ ferme, count: (prev?.count ?? 0) + 1 }));

    const enregistrer = async (values) => {
        const { photo, ...corps } = values;
        // La carte de localisation renvoie des nombres, la saisie des chaînes
        for (const cle of ["x", "y", "z"]) corps[cle] = corps[cle] === "" || corps[cle] == null ? null : Number.parseInt(corps[cle], 10);
        corps.dimension_id = corps.dimension_id === "" ? null : Number(corps.dimension_id);
        if (!Number.isInteger(corps.x) || !Number.isInteger(corps.z)) throw new Error("Les coordonnées X et Z sont des nombres entiers.");
        const data = edition.ferme ? await updateFerme(edition.ferme.id, corps) : await declarerFerme(corps);
        let texte = data?.text ?? "C'est fait.";
        if (photo) {
            try {
                await envoyerPhotoFerme(data.ferme.id, photo);
            } catch (error) {
                texte = `${texte} La photo n'a pas pu être envoyée : ${error.message}`;
            }
        }
        reload();
        Swal.fire({ icon: texte.includes("n'a pas pu") ? "warning" : "success", title: "Ferme enregistrée", text: texte });
    };

    const retirer = async (ferme) => {
        const result = await runAction(() => deleteFerme(ferme.id), {
            confirm: { title: `Retirer « ${ferme.title} » ?`, text: "La déclaration et sa photo seront supprimées. Une ferme en jeu doit rester déclarée.", button: "Retirer" },
        });
        if (result) reload();
    };

    const decider = async (ferme, status) => {
        const valider = status === "validee";
        const answer = await Swal.fire({
            icon: valider ? "question" : "warning",
            title: valider ? `Valider « ${ferme.title} » ?` : `Mise en conformité de « ${ferme.title} »`,
            input: valider ? "text" : "textarea",
            inputPlaceholder: valider ? "Note (facultative)" : "Ce qu'il faut corriger : déclarer, habiller, réduire…",
            showCancelButton: true,
            confirmButtonText: valider ? "Valider" : "Demander",
            cancelButtonText: "Annuler",
            inputValidator: (value) => (!valider && !value?.trim() ? "Dites ce qu'il faut mettre en conformité." : null),
        });
        if (!answer.isConfirmed) return;
        const result = await runAction(() => deciderFerme(ferme.id, status, answer.value || null));
        if (result) reload();
    };

    const actionsDeclarant = (ferme) => (
        <>
            <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => ouvrir(ferme)}>
                <FontAwesomeIcon icon="fa-solid fa-pen" />
                Modifier
            </button>
            <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => retirer(ferme)}>
                <FontAwesomeIcon icon="fa-solid fa-trash" />
                Retirer
            </button>
        </>
    );

    const actionsModerateur = (ferme) => (ferme.declarant?.id === user?.id ? (
        <span className="text-xs opacity-70 italic">Votre ferme : un autre modérateur l'examinera.</span>
    ) : (
        <>
            {ferme.status !== "validee" && (
                <button type="button" className="btn btn-xs btn-success" onClick={() => decider(ferme, "validee")}>Valider</button>
            )}
            <button type="button" className="btn btn-xs btn-error btn-soft" onClick={() => decider(ferme, "a_corriger")}>Mise en conformité</button>
            <button type="button" className="btn btn-xs btn-ghost" onClick={() => retirer(ferme)}>Retirer</button>
        </>
    ));

    const enAttente = toutes.filter((ferme) => ferme.status === "en_attente");
    const autres = toutes.filter((ferme) => ferme.status !== "en_attente");
    const declarer = () => requireLogin(() => ouvrir(), "déclarer une ferme");

    return (
        <>
            <Navbar active="fermes" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-wheat-awn"
                        title="Les fermes de Tetrago"
                        description="Toute ferme, manuelle ou automatique, se déclare et s'habille. Déclarez-la ici, avec sa justification RP et une photo : un modérateur RP la valide."
                        topRight={
                            <button onClick={declarer} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Déclarer une ferme" style={{ padding: "0.75rem 0.75rem 0.75rem 1.25rem", cursor: "pointer" }}>
                                <span className="flex">Ferme</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />

                    <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        {ETAPES.map((etape, index) => (
                            <li key={etape.titre} className="flex gap-3 bg-base-200 rounded-2xl p-3">
                                <FontAwesomeIcon icon={etape.icon} className="mt-1 opacity-70" />
                                <span>
                                    <strong>{index + 1}. {etape.titre}</strong>
                                    <span className="block text-sm opacity-80">{etape.texte}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                    <p className="text-sm opacity-70 w-full px-1">
                        Les règles complètes sont dans le <a href="/codex#fermes" className="link link-hover font-semibold">Codex, « Fermes & ressources »</a>. Vos déclarations ne sont visibles que de vous et des modérateurs RP.
                    </p>

                    {!user ? (
                        <EtatVide
                            icon="fa-solid fa-wheat-awn"
                            texte="Connectez-vous pour déclarer vos fermes et suivre leur validation."
                            action={{ label: "Se connecter", icon: "fa-solid fa-right-to-bracket", href: "/login" }}
                        />
                    ) : (
                        <>
                            {moderateur && (
                                <section id="a-examiner" className="flex flex-col gap-2 w-full">
                                    <TitleH2 text={`À examiner (${enAttente.length})`} icon="fas fa-stamp" aide="ferme" />
                                    {enAttente.length === 0 ? (
                                        <p className="text-sm opacity-70 px-1">Aucune ferme n'attend de décision.</p>
                                    ) : enAttente.map((ferme) => <FermeCard key={ferme.id} ferme={ferme} actions={actionsModerateur(ferme)} />)}
                                </section>
                            )}

                            <section id="mes-fermes" className="flex flex-col gap-2 w-full">
                                <TitleH2 text="Mes fermes" icon="fas fa-wheat-awn" fonctions={[{ id: 1, title: "Déclarer", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => ouvrir() }]} />
                                {mesFermes === null ? (
                                    <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
                                ) : mesFermes.length === 0 ? (
                                    <EtatVide
                                        icon="fa-solid fa-wheat-awn"
                                        texte="Vous n'avez déclaré aucune ferme."
                                        aide="Champ, étable, ferme à mobs ou machine : déclarez-la avant de l'exploiter."
                                        action={{ label: "Déclarer une ferme", icon: "fa-solid fa-plus", onClick: () => ouvrir() }}
                                    />
                                ) : mesFermes.map((ferme) => <FermeCard key={ferme.id} ferme={ferme} actions={actionsDeclarant(ferme)} />)}
                            </section>

                            {moderateur && autres.length > 0 && (
                                <section id="toutes" className="flex flex-col gap-2 w-full">
                                    <TitleH2 text="Fermes déjà examinées" icon="fas fa-list-check" />
                                    {autres.map((ferme) => <FermeCard key={ferme.id} ferme={ferme} actions={actionsModerateur(ferme)} />)}
                                </section>
                            )}
                        </>
                    )}

                    {user && edition ? (
                        <FormModal
                            key={`${MODAL_ID}-${edition.count}`}
                            id={MODAL_ID}
                            title={edition.ferme ? `Modifier « ${edition.ferme.title} »` : "Déclarer une ferme"}
                            intro={edition.ferme && edition.ferme.status !== "en_attente" && edition.ferme.declarant?.id === user.id ? "Modifiée, la ferme repasse en attente de validation." : null}
                            fields={champs(villes, edition.ferme)}
                            initialValues={valeursInitiales(edition.ferme, dimensions)}
                            submitLabel={edition.ferme ? "Enregistrer" : "Déclarer"}
                            onSubmit={enregistrer}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
