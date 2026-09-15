import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";
import GrimoireHero from "../../components/Layouts/GrimoireHero";
import SkeletonCivilisation from "../../components/Objects/SkeletonCivilisation";
import PersonnageAvatar from "../../components/Objects/PersonnageAvatar";
import FormModal from "../../components/Modals/FormModal";

import { Config_RP_Navbar } from "../../components/Navigation/Config_RP_Navbar";
import { showModalID } from "../../components/Functions/showModal";
import { requireLogin } from "../../components/Functions/requireLogin";
import { plural } from "../../components/Functions/plural";
import { EMPTY_LIEUX, EMPTY_REFERENTIEL, PERSONNAGE_INITIAL, PERSONNAGE_STATUTS, identityText, loadLieux, loadReferentiel, personnageFormFields, residenceText } from "../../components/Functions/personnages";
import { getSessionUser } from "../../services/session";
import { apiRequest, getPersonnages } from "../../services/api";

const CREATE_MODAL_ID = "personnage-create-modal";

const openCreate = () => requireLogin(() => showModalID(CREATE_MODAL_ID), "créer un personnage");

// Recherche sans tenir compte des accents ni de la casse
const normalize = (text) => (text || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function PersonnageCard({ fiche }) {
    const { personnage, joueur } = fiche;
    const statut = PERSONNAGE_STATUTS[personnage.status] ?? PERSONNAGE_STATUTS.vivant;
    const residence = residenceText(fiche);
    const identity = identityText(fiche);
    return (
        <a href={`/personnage/${personnage.id}`} className="flex flex-col gap-2 p-4 bg-base-200 hover:bg-base-300 transition-colors rounded-3xl shadow-md w-full min-w-0">
            <div className="flex flex-row items-center gap-3">
                <PersonnageAvatar personnage={personnage} size="lg" />
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="flex flex-row flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold break-words">{personnage.name}</h2>
                        {personnage.status !== "vivant" ? <span className={`badge badge-sm ${statut.badge}`}>{statut.label}</span> : null}
                    </span>
                    {identity ? <span className="text-sm font-semibold truncate">{identity}</span> : null}
                    {joueur ? <span className="text-sm opacity-70 truncate">Joué par {joueur.full_name || joueur.username}</span> : null}
                </div>
            </div>
            {personnage.description ? <p className="line-clamp-2 break-words">{personnage.description}</p> : null}
            <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm opacity-70">
                {residence ? (
                    <span className="flex flex-row items-center gap-1 min-w-0">
                        <FontAwesomeIcon icon="fa-solid fa-house" />
                        <span className="truncate">{residence}</span>
                    </span>
                ) : null}
                <span className="flex flex-row items-center gap-1">
                    <FontAwesomeIcon icon="fa-solid fa-feather" />
                    <span>{plural(fiche.messages_count, "message")}</span>
                </span>
            </div>
        </a>
    );
}

export default function PersonnagesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const user = getSessionUser();
    const [fiches, setFiches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lieux, setLieux] = useState(EMPTY_LIEUX);
    const [referentiel, setReferentiel] = useState(EMPTY_REFERENTIEL);
    const [search, setSearch] = useState("");
    const [statut, setStatut] = useState("");
    const [onlyMine, setOnlyMine] = useState(false);

    useEffect(() => {
        getPersonnages()
            .then((data) => setFiches(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Error fetching personnages:", err);
                setError(true);
            })
            .finally(() => setLoading(false));
        loadLieux().then(setLieux);
        loadReferentiel().then(setReferentiel);
    }, []);

    // Lien « Nouveau personnage » du profil : /personnages?nouveau=1
    const wantsCreate = searchParams.get("nouveau") === "1";
    useEffect(() => {
        if (wantsCreate) openCreate();
    }, [wantsCreate]);

    const query = normalize(search.trim());
    const visibles = fiches.filter((fiche) => (
        (!statut || fiche.personnage.status === statut)
        && (!onlyMine || fiche.personnage.user_id === user?.id)
        && (!query || normalize([fiche.personnage.name, fiche.joueur?.full_name, fiche.joueur?.username, residenceText(fiche), identityText(fiche)].join(" ")).includes(query))
    ));

    const createPersonnage = async (values) => {
        const data = await apiRequest("POST", "/personnages/create", values);
        await Swal.fire({ icon: "success", title: "Personnage créé", text: `${data.personnage.name} est prêt à entrer dans l'histoire.` });
        navigate(`/personnage/${data.personnage.id}`);
    };

    return (
        <>
            <Navbar active="personnages" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-masks-theater"
                        title="Les Personnages de Tetrago"
                        description="Héros, marchands, prêtres ou brigands : chaque joueur incarne autant de personnages qu'il le souhaite, sans validation. Associez-leur vos messages de journaux pour signer vos récits de leur nom."
                        topRight={
                            <button onClick={openCreate} aria-label="Nouveau personnage" className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Nouveau personnage" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                <span className="flex">Personnage</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    <DynamicNavbar active_id="personnages" navigation={Config_RP_Navbar.navigation} shadow="md" />

                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full">
                        <label className="input input-ghost bg-base-200 rounded-3xl flex-1 min-w-0 sm:min-w-64">
                            <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-60" />
                            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, joueur, lieu, espèce…" aria-label="Rechercher un personnage" />
                        </label>
                        <select value={statut} onChange={(e) => setStatut(e.target.value)} aria-label="Filtrer par statut" className="select select-ghost bg-base-200 rounded-3xl w-full sm:w-44">
                            <option value="">Tous les statuts</option>
                            {Object.entries(PERSONNAGE_STATUTS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                        </select>
                        {user ? (
                            <label className="flex flex-row items-center gap-2 cursor-pointer bg-base-200 rounded-3xl px-4 h-10">
                                <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="toggle toggle-sm toggle-primary" />
                                <span>Mes personnages</span>
                            </label>
                        ) : null}
                    </div>

                    {loading ? (
                        <div className="flex flex-col gap-4 w-full">
                            <SkeletonCivilisation />
                            <SkeletonCivilisation />
                        </div>
                    ) : error ? (
                        <div className="alert alert-error w-full">
                            <span>Impossible de récupérer la liste des personnages.</span>
                        </div>
                    ) : fiches.length === 0 ? (
                        <p className="italic opacity-70">Aucun personnage n'a encore été créé : soyez le premier !</p>
                    ) : visibles.length === 0 ? (
                        <p className="italic opacity-70">Aucun personnage ne correspond à votre recherche.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                            {visibles.map((fiche) => <PersonnageCard key={fiche.personnage.id} fiche={fiche} />)}
                        </div>
                    )}

                    {user ? (
                        <FormModal
                            id={CREATE_MODAL_ID}
                            title="Créer un personnage"
                            intro="Pas de validation : votre personnage existe dès sa création. Vous pourrez le modifier à tout moment."
                            fields={personnageFormFields(lieux, referentiel)}
                            initialValues={PERSONNAGE_INITIAL}
                            submitLabel="Créer"
                            onSubmit={createPersonnage}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
