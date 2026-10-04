import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import EtatVide from "@/components/ui/EtatVide";
import FormModal from "@/components/modals/FormModal";

import { showModalID } from "@/utils/showModal";
import { isModerateur, runAction } from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import { CATEGORIES_CHRONIQUES, anneeRp, categorieChronique, dateRp } from "@/config/chroniques";
import { createFaitChronique, deleteFaitChronique, getChroniques, updateFaitChronique } from "@/services/api";

// ===== Chroniques de Tetrago =====
// La frise de l'histoire du monde, remplie toute seule par l'API (Shard-API crud_chroniques) : fondations, alliances,
// guerres et faits de leur chronologie. Les modérateurs RP y ajoutent les faits marquants que les données ne disent
// pas. Classée en dates RP, par année du monde ; sans date RP, une entrée n'y figure pas.

const MODAL_ID = "fait-modal";

const champs = [
    { name: "title", label: "Titre", type: "text", required: true, placeholder: "Ex. Le Grand Hiver, la peste de Narva" },
    { name: "date_rp", label: "Date RP", type: "date", required: true, help: "La date dans le monde : elle place le fait dans la frise." },
    { name: "description", label: "Récit", type: "textarea", placeholder: "Ce qui s'est passé, et ce que cela a changé." },
];

const valeursInitiales = (fait) => ({
    title: fait?.title ?? "",
    date_rp: fait?.date_rp ?? "",
    description: fait?.description ?? "",
});

// Groupes par année RP, dans l'ordre de la frise (la plus récente d'abord)
function parAnnee(entrees) {
    const groupes = [];
    for (const entree of entrees) {
        const cle = anneeRp(entree.date_rp);
        if (groupes.at(-1)?.cle !== cle) groupes.push({ cle, titre: `An ${cle}`, entrees: [] });
        groupes.at(-1).entrees.push(entree);
    }
    return groupes;
}

function Entree({ entree, actions }) {
    const categorie = categorieChronique(entree.categorie);
    const rp = dateRp(entree.date_rp);
    return (
        <li id={`chronique-${entree.id}`} className="relative flex flex-col gap-0.5 scroll-mt-24">
            <span className={`absolute -left-[2.35rem] top-0 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-base-100 ${categorie.puce}`} aria-hidden="true">
                <FontAwesomeIcon icon={categorie.icon} className="text-xs" />
            </span>
            <span className="text-xs opacity-70 flex flex-wrap gap-x-2">
                <time dateTime={entree.date_rp} className="font-semibold">{rp}</time>
                <span>· {categorie.label}</span>
            </span>
            {entree.lien ? <a href={entree.lien} className="font-semibold link link-hover break-words">{entree.title}</a> : <strong className="break-words">{entree.title}</strong>}
            {entree.description && <p className="text-sm opacity-80 break-words whitespace-pre-line">{entree.description}</p>}
            {actions && <span className="flex flex-row gap-1 mt-1">{actions}</span>}
        </li>
    );
}

export default function ChroniquesPage() {
    const user = getSessionUser();
    const moderateur = isModerateur(user);
    const [entrees, setEntrees] = useState(null);
    const [filtres, setFiltres] = useState(() => new Set(Object.keys(CATEGORIES_CHRONIQUES)));
    const [edition, setEdition] = useState(null); // { fait (null : nouveau), count }
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        getChroniques()
            .then((data) => setEntrees(Array.isArray(data) ? data : []))
            .catch(() => setEntrees([]));
    }, [reloadKey]);

    useEffect(() => { if (edition) showModalID(MODAL_ID); }, [edition]);

    const reload = () => setReloadKey((key) => key + 1);
    const ouvrir = (fait = null) => setEdition((prev) => ({ fait, count: (prev?.count ?? 0) + 1 }));

    const basculer = (categorie) => setFiltres((prev) => {
        const next = new Set(prev);
        if (next.has(categorie)) next.delete(categorie);
        else next.add(categorie);
        return next;
    });

    const enregistrer = async (values) => {
        const corps = { title: values.title, date_rp: values.date_rp, description: values.description || null };
        const data = edition.fait ? await updateFaitChronique(edition.fait.fait_id, corps) : await createFaitChronique(corps);
        Swal.fire({ icon: "success", title: data.text });
        reload();
    };

    const retirer = async (fait) => {
        const result = await runAction(() => deleteFaitChronique(fait.fait_id), {
            confirm: { title: `Retirer « ${fait.title} » des chroniques ?`, button: "Retirer" },
        });
        if (result) reload();
    };

    const actionsFait = (entree) => (moderateur && entree.fait_id ? (
        <>
            <button type="button" className="btn btn-xs btn-ghost bg-base-200" onClick={() => ouvrir(entree)}>
                <FontAwesomeIcon icon="fa-solid fa-pen" />
                Modifier
            </button>
            <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => retirer(entree)}>
                <FontAwesomeIcon icon="fa-solid fa-trash" />
                Retirer
            </button>
        </>
    ) : null);

    const comptes = Object.fromEntries(Object.keys(CATEGORIES_CHRONIQUES).map((categorie) => [categorie, (entrees ?? []).filter((e) => e.categorie === categorie).length]));
    const visibles = (entrees ?? []).filter((entree) => filtres.has(entree.categorie));

    return (
        <>
            <Navbar active="chroniques" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-3">
                    <GrimoireHero
                        icon="fa-solid fa-timeline"
                        title="Les chroniques de Tetrago"
                        description="L'histoire du monde s'écrit toute seule, au fil des années : fondations, alliances, guerres, batailles et faits marquants."
                        topRight={moderateur ? (
                            <button onClick={() => ouvrir()} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Inscrire un fait marquant" style={{ padding: "0.75rem 0.75rem 0.75rem 1.25rem", cursor: "pointer" }}>
                                <span className="flex">Fait marquant</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        ) : null}
                    />

                    <div role="group" aria-label="Catégories affichées" className="flex flex-row flex-wrap gap-2 w-full">
                        {Object.entries(CATEGORIES_CHRONIQUES).map(([categorie, config]) => (
                            <button
                                key={categorie}
                                type="button"
                                aria-pressed={filtres.has(categorie)}
                                onClick={() => basculer(categorie)}
                                className={`btn btn-sm rounded-3xl gap-2 ${filtres.has(categorie) ? "btn-secondary" : "btn-ghost bg-base-200 opacity-70"}`}
                            >
                                <FontAwesomeIcon icon={config.icon} />
                                {config.label}
                                <span className="badge badge-sm">{comptes[categorie]}</span>
                            </button>
                        ))}
                    </div>

                    {entrees === null ? (
                        <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
                    ) : visibles.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-timeline"
                            texte={entrees.length === 0 ? "Les chroniques sont encore vierges." : "Aucune entrée dans les catégories choisies."}
                            aide={entrees.length === 0 ? "Fondez une civilisation ou une alliance en lui donnant sa date de fondation dans le monde : l'histoire s'écrira ici." : "Choisissez d'autres catégories ci-dessus."}
                        />
                    ) : (
                        <div className="flex flex-col gap-6 w-full">
                            {parAnnee(visibles).map((groupe) => (
                                <section key={groupe.cle} aria-label={groupe.titre} className="flex flex-col gap-3">
                                    <h2 className="text-lg font-semibold bg-base-200 rounded-2xl px-4 py-2">{groupe.titre}</h2>
                                    <ol className="flex flex-col gap-4 border-l-2 border-base-300 ml-5 pl-6">
                                        {groupe.entrees.map((entree) => <Entree key={entree.id} entree={entree} actions={actionsFait(entree)} />)}
                                    </ol>
                                </section>
                            ))}
                        </div>
                    )}

                    {moderateur && edition ? (
                        <FormModal
                            key={`${MODAL_ID}-${edition.count}`}
                            id={MODAL_ID}
                            title={edition.fait ? `Modifier « ${edition.fait.title} »` : "Inscrire un fait marquant"}
                            intro={edition.fait ? null : "Ce que les données du site ne disent pas : une catastrophe, un mariage princier, une découverte…"}
                            fields={champs}
                            initialValues={valeursInitiales(edition.fait)}
                            submitLabel={edition.fait ? "Enregistrer" : "Inscrire"}
                            onSubmit={enregistrer}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
