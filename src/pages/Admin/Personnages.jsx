import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import FormModal from "../../components/Modals/FormModal";

import { showModalID } from "../../components/Functions/showModal";
import { isModerateur, runAction } from "../../components/Functions/conflits";
import { EMPTY_REFERENTIEL } from "../../components/Functions/personnages";
import { getSessionUser } from "../../services/session";
import { apiRequest, getPersonnageReferentiel } from "../../services/api";

const MODAL_ID = "admin-referentiel-modal";

const KINDS = [
    { key: "especes", title: "Espèces", singular: "espèce", icon: "fa-solid fa-dna" },
    { key: "classes", title: "Classes", singular: "classe", icon: "fa-solid fa-hat-wizard" },
];

function AccessMessage({ text, link, label }) {
    return (
        <>
            <Navbar active="admin-personnages" />
            <div className="text-center py-12 px-4">
                <p className="text-xl">{text}</p>
                <Link to={link} className="btn btn-primary mt-4">{label}</Link>
            </div>
        </>
    );
}

// Espèces et classes proposées sur les fiches des personnages (administrateurs et modérateurs RP)
export default function AdminPersonnagesPage() {
    const user = getSessionUser();
    const allowed = isModerateur(user);
    const [referentiel, setReferentiel] = useState(EMPTY_REFERENTIEL);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        if (!allowed) return;
        getPersonnageReferentiel()
            .then((data) => setReferentiel({ especes: data?.especes ?? [], classes: data?.classes ?? [] }))
            .catch((error) => console.error("Error fetching referentiel:", error))
            .finally(() => setLoading(false));
    }, [allowed, reloadKey]);

    // La modale est recréée pour chaque élément (valeurs initiales) : on l'ouvre une fois montée
    useEffect(() => {
        if (editing) showModalID(MODAL_ID);
    }, [editing]);

    if (!user) {
        return <AccessMessage text="Vous devez être connecté pour accéder à cette page." link="/login" label="Se connecter" />;
    }
    if (!allowed) {
        return <AccessMessage text="Seuls les administrateurs et modérateurs RP gèrent les espèces et les classes." link="/" label="Retour à l'accueil" />;
    }

    const reload = () => setReloadKey((key) => key + 1);
    const openForm = (kind, item = null) => setEditing((prev) => ({ kind, item, count: (prev?.count ?? 0) + 1 }));

    const save = async (values) => {
        const { kind, item } = editing;
        const data = item
            ? await apiRequest("PUT", `/personnages/referentiel/${kind.key}/${item.id}`, values)
            : await apiRequest("POST", `/personnages/referentiel/${kind.key}`, values);
        Swal.fire({ icon: "success", title: "Succès", text: data?.text ?? "C'est fait." });
        reload();
    };

    const remove = async (kind, item) => {
        const result = await runAction(() => apiRequest("DELETE", `/personnages/referentiel/${kind.key}/${item.id}`), {
            confirm: { title: `Supprimer « ${item.title} » ?`, text: `Les personnages concernés n'auront plus d'${kind.singular} renseignée.`, button: "Supprimer" },
        });
        if (result) reload();
    };

    return (
        <>
            <Navbar active="admin-personnages" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-4 w-full">
                    <TitleH1 text="Espèces et classes" icon="fas fa-masks-theater" />
                    <p className="text-sm opacity-70 px-1">
                        Valeurs proposées sur les fiches des personnages. Supprimer une valeur la retire simplement des personnages qui l'utilisaient.
                    </p>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : KINDS.map((kind) => (
                        <section key={kind.key} className="flex flex-col gap-2">
                            <TitleH2
                                text={`${kind.title} (${referentiel[kind.key].length})`}
                                icon={kind.icon}
                                fonctions={[{ id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, tooltip: { text: `Ajouter une ${kind.singular}`, position: "bottom" }, function: () => openForm(kind) }]}
                            />
                            {referentiel[kind.key].length === 0 ? (
                                <i className="opacity-70">Aucune {kind.singular} définie.</i>
                            ) : (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {referentiel[kind.key].map((item) => (
                                        <li key={item.id} className="flex flex-row items-center gap-2 bg-base-200 rounded-2xl p-3">
                                            <span className="flex flex-col flex-1 min-w-0">
                                                <span className="font-bold break-words">{item.title}</span>
                                                {item.description ? <span className="text-sm opacity-70 break-words">{item.description}</span> : null}
                                            </span>
                                            <button type="button" className="btn btn-sm btn-ghost btn-circle" aria-label={`Modifier ${item.title}`} onClick={() => openForm(kind, item)}>
                                                <FontAwesomeIcon icon="fa-solid fa-pen" />
                                            </button>
                                            <button type="button" className="btn btn-sm btn-ghost btn-circle text-error" aria-label={`Supprimer ${item.title}`} onClick={() => remove(kind, item)}>
                                                <FontAwesomeIcon icon="fa-solid fa-trash" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>

                {editing ? (
                    <FormModal
                        key={`referentiel-${editing.count}`}
                        id={MODAL_ID}
                        title={editing.item ? `Modifier « ${editing.item.title} »` : `Nouvelle ${editing.kind.singular}`}
                        fields={[
                            { name: "title", label: "Nom", type: "text", required: true },
                            { name: "description", label: "Description", type: "textarea", placeholder: "Facultative" },
                        ]}
                        initialValues={{ title: editing.item?.title ?? "", description: editing.item?.description ?? "" }}
                        submitLabel={editing.item ? "Enregistrer" : "Ajouter"}
                        onSubmit={save}
                    />
                ) : null}
            </main>
        </>
    );
}
