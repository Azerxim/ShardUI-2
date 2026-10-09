import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import DynamicNavbar from "@/components/layout/DynamicNavbar";
import TitleH2 from "@/components/ui/TitleH2";
import EtatVide from "@/components/ui/EtatVide";
import FormModal from "@/components/modals/FormModal";
import ActionCard from "@/components/actions/ActionCard";
import BarreFiltres from "@/components/ui/BarreFiltres";
import { correspond, normalize, parDate, parTitre, useFiltresMemorises } from "@/utils/filtres";

import { showModalID } from "@/utils/showModal";
import { requireLogin } from "@/utils/requireLogin";
import { isModerateur, managedEntities } from "@/utils/conflits";
import { alerteErreur } from "@/utils/alerteErreur";
import { getSessionUser } from "@/services/session";
import {
    createAction, getActionsSecretes, getCivilisations, getGuerres, getMesActions, getPersonnagesOfUser, getReligions,
    lireAction, revelerAction,
} from "@/services/api";

// ===== Actions secrètes =====
// Une action RP consignée avant d'être jouée : scellée à l'heure réelle, révélée plus tard par son auteur, par un
// modérateur RP ou à une date fixée. Avant révélation, le public n'en voit que l'existence (code, date, empreinte).
// Lecture tracée : administrateurs et modérateurs RP jouent aussi ; ils peuvent lire, mais chaque lecture est
// enregistrée, visible de l'auteur aussitôt et de tous à la révélation.

const CREATE_MODAL_ID = "action-secrete-modal";

// ===== Filtres du registre public (BarreFiltres) =====
// Une action scellée ne montre que son code et sa date : auteur, titre, guerre et nature ne se filtrent qu'une fois révélée.
const FILTRES_DEFAUT = { recherche: "", etat: "toutes", nature: "toutes", guerre: "toutes", tri: "scellee-desc" };

const ETATS = { toutes: "Scellées et révélées", scellees: "Encore scellées", revelees: "Révélées" };
const NATURES = { toutes: "Toutes natures", actions: "Actions (révélées)", pieges: "Pièges mortels (révélés)" };

const TRIS = {
    "scellee-desc": { label: "Scellées récemment", compare: parDate((a) => a.created_at, -1) },
    "scellee-asc": { label: "Scellées il y a longtemps", compare: parDate((a) => a.created_at, 1) },
    "revelee-desc": { label: "Révélées récemment", compare: parDate((a) => a.revealed_at, -1) },
    "code-asc": { label: "Code", compare: parTitre((a) => a.code, 1) },
};
const TRI_LIBELLES = Object.fromEntries(Object.entries(TRIS).map(([value, { label }]) => [value, label]));

const filtrerActions = (actions, filtres, guerreFiltre) => {
    const query = normalize(filtres.recherche.trim());
    return actions
        .filter((action) => correspond(query, [action.code, action.title, action.content, action.entite?.title, action.guerre?.title, action.created_by?.full_name, action.created_by?.username]))
        .filter((action) => ({ toutes: true, scellees: !action.revealed, revelees: action.revealed })[filtres.etat])
        .filter((action) => ({ toutes: true, actions: action.revealed && !action.piege, pieges: action.revealed && action.piege })[filtres.nature])
        .filter((action) => guerreFiltre === "toutes" || String(action.guerre?.id) === guerreFiltre)
        .sort(TRIS[filtres.tri].compare);
};

const ETAPES = [
    { icon: "fa-solid fa-envelope-circle-check", titre: "Scellez", texte: "L'action est horodatée à la date et à l'heure réelles. Son empreinte, publiée aussitôt, prouvera qu'elle n'a pas été réécrite." },
    { icon: "fa-solid fa-eye", titre: "Lecture tracée", texte: "Les administrateurs et modérateurs RP peuvent la lire pour arbitrer, mais chaque lecture est enregistrée et rendue publique." },
    { icon: "fa-solid fa-lock-open", titre: "Révélez", texte: "Vous la révélez quand vous le voulez, ou à la date choisie au dépôt ; un modérateur RP peut aussi la révéler pour trancher un litige." },
];

export default function ActionsSecretesPage() {
    const user = getSessionUser();
    const moderateur = isModerateur(user);
    const [registre, setRegistre] = useState(null);
    const [mesActions, setMesActions] = useState([]);
    const [luesParMoi, setLuesParMoi] = useState({});
    const [reloadKey, setReloadKey] = useState(0);
    const [auteurs, setAuteurs] = useState({ personnages: [], civilisations: [], religions: [] });
    const [guerres, setGuerres] = useState([]);
    const [pret, setPret] = useState(false);
    const [filtres, changerFiltres] = useFiltresMemorises("actions-filtres", FILTRES_DEFAUT, { etat: ETATS, nature: NATURES, tri: TRIS });
    // Bouton « Action » des pages de guerre : /actions-secretes?nouvelle=1[&guerre=ID]
    const [searchParams] = useSearchParams();
    const demandeDepot = searchParams.get("nouvelle") === "1";
    const guerreDemandee = searchParams.get("guerre") || "";

    useEffect(() => {
        getActionsSecretes()
            .then((data) => setRegistre(Array.isArray(data) ? data : []))
            .catch(() => setRegistre([]));
        if (user) {
            getMesActions().then((data) => setMesActions(Array.isArray(data) ? data : [])).catch(() => setMesActions([]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey]);

    // Au nom de qui déposer : ses personnages, les civilisations et religions qu'on dirige ; à quelle guerre en cours rattacher
    useEffect(() => {
        if (!user) return;
        Promise.all([
            getPersonnagesOfUser(user.id).catch(() => []),
            getCivilisations().catch(() => []),
            getReligions().catch(() => []),
            getGuerres().catch(() => []),
        ]).then(([personnages, civilisations, religions, listeGuerres]) => {
            setAuteurs({
                personnages: (Array.isArray(personnages) ? personnages : []).map((item) => item.personnage),
                civilisations: managedEntities(civilisations, "civilisation"),
                religions: managedEntities(religions, "religion"),
            });
            setGuerres((Array.isArray(listeGuerres) ? listeGuerres : []).filter(({ guerre }) => guerre.status === "en_cours").map(({ guerre }) => guerre));
            setPret(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const recharger = () => setReloadKey((key) => key + 1);
    const mesIds = new Set(mesActions.map((action) => action.id));
    const autres = (registre || []).filter((action) => !mesIds.has(action.id)).map((action) => luesParMoi[action.id] || action);
    const scellees = autres.filter((action) => !action.revealed).length;

    // Filtre « guerre » : guerres liées aux actions révélées. Une valeur gardée qui n'y figure plus est ignorée.
    const guerresDesActions = new Map(autres.filter((action) => action.guerre).map((action) => [action.guerre.id, action.guerre]));
    const optionsGuerres = [
        ["toutes", "Toutes les guerres"],
        ...[...guerresDesActions.values()].sort((a, b) => (a.title || "").localeCompare(b.title || "")).map((guerre) => [String(guerre.id), guerre.title]),
    ];
    const guerreFiltre = optionsGuerres.some(([value]) => value === filtres.guerre) ? filtres.guerre : "toutes";
    const affichees = filtrerActions(autres, filtres, guerreFiltre);

    const optionsAuteur = [
        ...auteurs.personnages.map((p) => ({ value: `personnage:${p.id}`, label: `Personnage · ${p.name}` })),
        ...auteurs.civilisations.map((c) => ({ value: `civilisation:${c.id}`, label: `Civilisation · ${c.title}` })),
        ...auteurs.religions.map((r) => ({ value: `religion:${r.id}`, label: `Religion · ${r.title}` })),
    ];

    const fields = [
        {
            name: "auteur", label: "Au nom de", type: "select", required: true, options: optionsAuteur,
            empty: "Créez d'abord un personnage, ou dirigez une civilisation ou une religion.",
        },
        { name: "title", label: "Titre", type: "text", required: true, placeholder: "Ex. Piège sur la route du Gué" },
        { name: "content", label: "L'action", type: "textarea", required: true, placeholder: "Ce qui est décidé, où, quand, par qui : tout ce qui devra être prouvé à la révélation." },
        {
            name: "piege", label: "Nature", type: "radio", required: true,
            options: [{ value: "non", label: "Action" }, { value: "oui", label: "Piège mortel" }],
            help: (values) => values.piege === "oui"
                ? "Le piège ne tuera que si un modérateur RP le valide après sa révélation ; sinon il ne fait que blesser. Cela ne se déclare qu'au dépôt."
                : "Un piège qui doit pouvoir tuer se déclare maintenant : il ne peut plus l'être après coup.",
        },
        {
            name: "guerre_id", label: "Guerre liée", type: "select", placeholder: "Aucune",
            options: guerres.map((guerre) => ({ value: guerre.id, label: guerre.title })).sort((a, b) => a.label.localeCompare(b.label)),
            empty: "Aucune guerre en cours.",
            help: "Facultatif. La guerre n'est indiquée qu'à la révélation.",
        },
        {
            name: "reveal_at", label: "Révélation automatique", type: "datetime-local",
            help: "Facultatif. Sans date, l'action reste scellée jusqu'à ce que vous la révéliez.",
        },
    ];

    const sceller = async (values) => {
        const [entity_type, entity_id] = String(values.auteur || "").split(":");
        const data = await createAction({
            entity_type,
            entity_id: Number(entity_id),
            title: values.title,
            content: values.content,
            guerre_id: values.guerre_id ? Number(values.guerre_id) : null,
            reveal_at: values.reveal_at || null,
            piege: values.piege === "oui",
        });
        await Swal.fire({
            icon: "success",
            title: `Action ${data.action.code} scellée`,
            text: `Horodatée le ${new Date(data.action.created_at).toLocaleString("fr-FR")}. Elle ne peut plus être modifiée ni supprimée.`,
        });
        recharger();
    };

    const ouvrirDepot = () => requireLogin(() => showModalID(CREATE_MODAL_ID), "sceller une action");

    // Formulaire ouvert d'emblée quand on arrive d'une page de guerre (après le chargement des auteurs et des guerres,
    // sinon la modale serait recréée, donc refermée, par le changement de sa key)
    useEffect(() => {
        if (!demandeDepot) return;
        if (!user) ouvrirDepot();
        else if (pret) showModalID(CREATE_MODAL_ID);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [demandeDepot, pret]);

    const lire = async (action) => {
        const answer = await Swal.fire({
            icon: "warning",
            title: "Lecture tracée",
            text: `Votre lecture de ${action.code} sera enregistrée : son auteur la verra aussitôt, et tout le monde à sa révélation.`,
            showCancelButton: true,
            confirmButtonText: "Lire quand même",
            cancelButtonText: "Annuler",
        });
        if (!answer.isConfirmed) return;
        try {
            const data = await lireAction(action.id);
            setLuesParMoi((prev) => ({ ...prev, [action.id]: data.action }));
        } catch (error) {
            alerteErreur("Lecture impossible", error);
        }
    };

    const reveler = async (action, estAuteur) => {
        let motif = null;
        if (estAuteur) {
            const answer = await Swal.fire({
                icon: "warning",
                title: `Révéler ${action.code} ?`,
                text: "Son contenu, son auteur et les lectures tracées deviennent publics, définitivement.",
                showCancelButton: true,
                confirmButtonText: "Révéler",
                cancelButtonText: "Annuler",
            });
            if (!answer.isConfirmed) return;
        } else {
            const answer = await Swal.fire({
                icon: "warning",
                title: `Révéler ${action.code} en tant que modérateur RP`,
                text: "Le motif sera publié avec l'action.",
                input: "textarea",
                inputPlaceholder: "Ex. litige sur l'assassinat de la nuit du 3 octobre",
                inputValidator: (value) => (!value?.trim() ? "Le motif est obligatoire." : null),
                showCancelButton: true,
                confirmButtonText: "Révéler",
                cancelButtonText: "Annuler",
            });
            if (!answer.isConfirmed) return;
            motif = answer.value.trim();
        }
        try {
            const data = await revelerAction(action.id, motif);
            await Swal.fire({ icon: "success", title: `${data.action.code} est révélée`, text: "Elle figure désormais en entier dans le registre public." });
            setLuesParMoi((prev) => ({ ...prev, [action.id]: data.action }));
            recharger();
        } catch (error) {
            alerteErreur("Révélation impossible", error);
        }
    };

    return (
        <>
            <Navbar active="actions" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-user-secret"
                        title="Les actions secrètes"
                        description="Un piège, un complot, une marche de nuit : consignez votre action avant de la jouer. Scellée à l'heure réelle, elle prouvera à sa révélation qu'elle avait été décidée avant, et non après coup."
                        topRight={
                            <button onClick={ouvrirDepot} aria-label="Sceller une action" className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Sceller une action" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                <span className="flex">Action</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    {/* <DynamicNavbar active_id="actions" /> */}

                    <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full my-2">
                        {ETAPES.map((etape, index) => (
                            <li key={etape.titre} className="flex gap-3 bg-base-200 rounded-2xl p-4">
                                <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-secondary text-secondary-content">
                                    <FontAwesomeIcon icon={etape.icon} />
                                </span>
                                <span>
                                    <strong>{index + 1}. {etape.titre}</strong>
                                    <span className="block text-sm opacity-80">{etape.texte}</span>
                                </span>
                            </li>
                        ))}
                    </ol>

                    {mesActions.length > 0 && (
                        <>
                            <TitleH2 text="Mes actions" icon="fa-solid fa-feather-pointed" />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full items-start">
                                {mesActions.map((action) => (
                                    <ActionCard key={action.id} action={action} onReveler={action.revealed ? null : () => reveler(action, true)} />
                                ))}
                            </div>
                        </>
                    )}

                    <TitleH2 text="Registre public" icon="fa-solid fa-book-open" aide="action" />
                    {registre === null ? (
                        <div className="flex justify-center py-8 w-full"><span className="loading loading-spinner loading-lg"></span></div>
                    ) : autres.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-user-secret"
                            texte={mesActions.length ? "Aucune autre action n'a encore été scellée." : "Aucune action n'a encore été scellée."}
                            aide="Préparez un coup en secret : scellez-le maintenant, révélez-le quand il aura été joué."
                            action={{ label: "Sceller une action", icon: "fa-solid fa-plus", onClick: ouvrirDepot }}
                        />
                    ) : (
                        <>
                            <p className="text-sm opacity-70 px-1 w-full">
                                {autres.length} action{autres.length > 1 ? "s" : ""}, dont {scellees} encore scellée{scellees > 1 ? "s" : ""}. Le contenu, l'auteur et la guerre liée d'une action scellée restent cachés.
                            </p>
                            <BarreFiltres
                                filtres={{ ...filtres, guerre: guerreFiltre }}
                                defauts={FILTRES_DEFAUT}
                                onChange={changerFiltres}
                                recherche={{ placeholder: "Code, titre, auteur, guerre…", label: "Rechercher une action" }}
                                selects={[
                                    { name: "etat", label: "État", options: ETATS, className: "sm:w-44" },
                                    { name: "nature", label: "Nature", options: NATURES, className: "sm:w-52" },
                                    { name: "guerre", label: "Guerre liée", options: optionsGuerres, className: "sm:w-48" },
                                    { name: "tri", label: "Trier", options: TRI_LIBELLES, className: "sm:w-52" },
                                ]}
                            />
                            {affichees.length === 0 ? (
                                <EtatVide
                                    icon="fa-solid fa-magnifying-glass"
                                    texte="Aucune action ne correspond à vos filtres."
                                    action={{ label: "Effacer les filtres", icon: "fa-solid fa-xmark", onClick: () => changerFiltres(FILTRES_DEFAUT) }}
                                />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full items-start">
                                    {affichees.map((action) => (
                                        <ActionCard
                                            key={action.id}
                                            action={action}
                                            onLire={moderateur && !action.revealed && action.content === undefined ? () => lire(action) : null}
                                            onReveler={moderateur && !action.revealed ? () => reveler(action, false) : null}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {user ? (
                        <FormModal
                            key={`${optionsAuteur.length}-${guerres.length}-${guerreDemandee}`}
                            initialValues={guerreDemandee ? { guerre_id: guerreDemandee, piege: "non" } : { piege: "non" }}
                            id={CREATE_MODAL_ID}
                            title="Sceller une action"
                            intro="Une fois scellée, l'action ne peut plus être modifiée ni supprimée. Les administrateurs et modérateurs RP peuvent la lire ; chaque lecture sera rendue publique à sa révélation."
                            fields={fields}
                            submitLabel="Sceller"
                            submitIcon="fas fa-envelope-circle-check"
                            onSubmit={sceller}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
