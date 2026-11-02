import { useState, useEffect } from "react";
import { usePageTitle } from "@/utils/pageTitle";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import EnTeteFiche from "@/components/ui/EnTeteFiche";
import InfoLine from "@/components/ui/InfoLine";
import Stat from "@/components/ui/Stat";
import SommaireFiche from "@/components/ui/SommaireFiche";
import TitleH2 from "@/components/ui/TitleH2";
import DynamicModal from "@/components/modals/DynamicModal";
import MarkdownTextEditor from "@/components/ui/MarkdownTextEditor";
import DescriptionLongue from "@/components/ui/DescriptionLongue";
import MapEmbed from "@/components/carte/MapEmbed";
import CatalogueMagasin from "@/components/commerces/CatalogueMagasin";

import { showModal, showModalID } from "@/utils/showModal";
import { checkMemberAuth } from "@/services/authorisation";
import TransferFounderModal from "@/components/membres/TransferFounderModal";
import { commerceModal } from "@/config/modals/commerce";
import { magasinModal } from "@/config/modals/magasin";
import { commerceMemberModal, commerceMemberEditModal } from "@/config/modals/member";
import MemberButton from "@/components/membres/MemberButton";
import JoinHint from "@/components/membres/JoinHint";
import { getCommerceById, getDimensions, getVilles, deleteMemberCommerce } from "@/services/api";
import Swal from "sweetalert2";
import { alerteErreur } from "@/utils/alerteErreur";
import { couleurFiche, metalSur } from "@/utils/couleurFiche";
import LivresLiesSection from "@/components/bibliotheque/LivresLiesSection";

const ROLE_ORDER = { Fondateur: 0, Admin: 1 };
const TRANSFER_MODAL_ID = "commerce-transfer-founder-modal";

// Un commerce privé n'est visible que par ses membres et les administrateurs du site
const canSeeCommerce = (commerce, members, user) => Boolean(
    commerce.is_public || user?.is_admin || (members || []).some((member) => member.user_id === user?.id)
);

const formatDate =(date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

// Magasin dans la liste d'un commerce (charte « Chancellerie ») : une ligne compacte (nom, badges, lieu, ouverture,
// actions), sa description et son catalogue. La carte s'ouvre à la demande sous la ligne.
function MagasinCard({ magasin, dimension, ville, auth }) {
    const [carte, setCarte] = useState(false);
    const opened = formatDate(magasin.founded_date);
    const lieu = [
        magasin.dimension_id ? `${dimension ? `${dimension.title} · ` : ""}X ${magasin.x ?? 0} · Z ${magasin.z ?? 0}` : null,
        opened ? `Ouvert le ${opened}` : null,
    ].filter(Boolean);

    return (
        // id : cible des liens de la recherche « Où acheter ? » (/commerce/:id#magasin-:magasinId)
        <div id={`magasin-${magasin.id}`} className="flex flex-col gap-2 w-full ligne-fiche scroll-mt-24 target:ring-2 target:ring-primary">
            <div className="flex flex-row items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-base-200 shrink-0">
                    <FontAwesomeIcon icon={magasin.is_siege ? "fa-solid fa-building" : "fa-solid fa-store"} />
                </span>
                <span className="flex flex-col flex-1 min-w-0">
                    <span className="flex flex-row flex-wrap items-center gap-2">
                        <span className="font-bold text-lg break-words">{magasin.title}</span>
                        {magasin.is_siege ? <span className="badge badge-sm badge-primary">Siège</span> : null}
                        {!magasin.is_public ? <span className="badge badge-sm badge-warning">Privé</span> : null}
                    </span>
                    <span className="flex flex-row flex-wrap items-center gap-x-2 text-sm opacity-80">
                        {ville ? (
                            <a href={`/civilisation/${ville.civilisation_id}/ville/${ville.id}`} className="link link-hover">{ville.title}</a>
                        ) : null}
                        {lieu.map((morceau, index) => (
                            <span key={morceau} className={`tabular-nums ${ville || index > 0 ? "before:content-['·'] before:mr-2" : ""}`}>{morceau}</span>
                        ))}
                    </span>
                </span>
                <span className="flex flex-row items-center gap-1 shrink-0">
                    {dimension ? (
                        <button type="button" className="btn btn-sm btn-ghost bg-base-200" aria-expanded={carte} onClick={() => setCarte((ouverte) => !ouverte)}>
                            <FontAwesomeIcon icon={carte ? "fa-solid fa-xmark" : "fa-solid fa-map-location-dot"} />
                            <span className="hidden sm:inline">{carte ? "Fermer la carte" : "Carte"}</span>
                        </button>
                    ) : null}
                    {auth ? (
                        <button type="button" className="btn btn-sm btn-ghost btn-circle tooltip tooltip-left" data-tip="Modifier le magasin" aria-label="Modifier le magasin" onClick={() => showModal(magasinModal, "edit", { id: magasin.id })}>
                            <FontAwesomeIcon icon="fa-solid fa-pen" />
                        </button>
                    ) : null}
                </span>
            </div>

            {magasin.description ? <p className="break-words sm:pl-[3.25rem]">{magasin.description}</p> : null}

            {carte && dimension ? (
                <div className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden">
                    <MapEmbed
                        dimension={dimension}
                        width="100%"
                        height="100%"
                        embed="commerces"
                        x={magasin.x}
                        z={magasin.z}
                        zoom={0}
                        title={`Carte de ${magasin.title}`}
                    />
                </div>
            ) : null}

            <div className="sm:pl-[3.25rem]">
                <CatalogueMagasin magasin={magasin} auth={auth} />
            </div>
        </div>
    );
}

// Enseigne d'un commerce pour l'en-tête de sa fiche : un panneau de métal suspendu à une potence de bois
function Enseigne({ couleur, titre }) {
    return (
        <span role="img" aria-label={titre} className="flex flex-col items-center shrink-0 w-28">
            <span className="w-28 h-2 rounded-full bg-[#7a5230] border-2 border-[#17131f]"></span>
            <span className="w-20 h-4 border-x-2 border-[#17131f]"></span>
            <span className="flex items-center justify-center w-28 h-20 rounded-2xl border-[3px] border-[#17131f] text-4xl" style={{ background: metalSur(couleur), color: couleur }}>
                <FontAwesomeIcon icon="fa-solid fa-shop" />
            </span>
        </span>
    );
}

export default function CommercePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [commerce, setCommerce] = useState(null);
    const [members, setMembers] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [dirigeant, setDirigeant] = useState(null);
    const [diriges, setDiriges] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [villes, setVilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    usePageTitle(commerce?.title);

    useEffect(() => {
        getCommerceById(id)
            .then((data) => {
                setCommerce(data.commerce ?? null);
                setMembers(data.members ?? []);
                setMagasins(data.magasins ?? []);
                setDirigeant(data.dirigeant ?? null);
                setDiriges(data.diriges ?? []);
            })
            .catch((error) => {
                console.error("Error fetching commerce:", error);
                setCommerce(null);
            })
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    // Données complémentaires : leur échec n'empêche pas l'affichage de la page
    useEffect(() => {
        getDimensions()
            .then(setDimensions)
            .catch((error) => console.error("Error fetching dimensions:", error));
        getVilles()
            .then(setVilles)
            .catch((error) => console.error("Error fetching villes:", error));
    }, []);

    // Lien vers un magasin (#magasin-12) : la fiche se charge après la navigation, on y descend une fois affichée
    useEffect(() => {
        const cible = decodeURIComponent(window.location.hash.slice(1));
        if (!loading && cible) requestAnimationFrame(() => document.getElementById(cible)?.scrollIntoView({ block: "start" }));
    }, [loading]);

    // Recharger après un ajout / une modification / une suppression de magasin (le siège peut changer)
    const reload = () => setReloadKey((key) => key + 1);

    // Fondateur, Admin du commerce ou administrateur du site ; pour un commerce dirigé, aussi le Fondateur et les
    // Admins du commerce dirigeant (même règle que l'API, _check_commerce_rights)
    const auth = checkMemberAuth(members) || Boolean(dirigeant && checkMemberAuth(dirigeant.members || []));
    const hidden = commerce && !canSeeCommerce(commerce, members, user);

    const addMember = (data) => {
        if (data.member) setMembers((prevMembers) => [...prevMembers, data.member]);
    };

    const handleMemberModify = (data) => {
        const updatedMember = data.member;
        if (!updatedMember) return;
        setMembers((prevMembers) => prevMembers.map((member) => member.user_id === updatedMember.user_id ? updatedMember : member));
    };

    const handleMemberDelete = async (member) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Êtes-vous sûr ?",
            text: "Ce membre sera retiré du commerce.",
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!result.isConfirmed) return;

        try {
            await deleteMemberCommerce(id, member.user_id);
            setMembers((prevMembers) => prevMembers.filter((m) => m.user_id !== member.user_id));
            Swal.fire({ icon: "success", title: "Succès", text: "Membre retiré du commerce avec succès." });
        } catch (error) {
            console.error("Erreur lors de la suppression du membre:", error);
            alerteErreur("Retrait du membre impossible", error);
        }
    };

    const FctMembers = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(commerceMemberModal, "add") }
    ];

    // Les rôles de plusieurs membres changent : on recharge la fiche
    const handleFounderTransfer = () => reload();

    const sortedMembers = [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2));

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(commerceModal, "edit") }
    ];

    const FctMagasins = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(magasinModal, "add") }
    ];

    const couleur = couleurFiche(null, commerce?.id);
    const btnReturn = { text: 'Retour aux commerces', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/commerces' };

    // Les magasins privés ne sont visibles que par le Fondateur, les Admins et les administrateurs du site
    const visibleMagasins = magasins.filter((magasin) => magasin.is_public || auth);
    const siege = visibleMagasins.find((magasin) => magasin.is_siege);
    const villeSiege = siege ? villes.find((ville) => ville.id === siege.ville_id) : null;
    const visibleDiriges = diriges.filter(({ commerce: dirige, members: dirigeMembers }) => canSeeCommerce(dirige, dirigeMembers, user));

    const BodyHTML = commerce ? (
        <>
            <EnTeteFiche
                couleur={couleur}
                embleme={<Enseigne couleur={couleur} titre={`Enseigne de ${commerce.title}`} />}
                surtitre={[commerce.is_public ? "Commerce public" : "Commerce privé", commerce.date_founded ? `fondé le ${formatDate(commerce.date_founded)}` : null].filter(Boolean).join(" · ")}
                titre={commerce.title}
                infos={dirigeant ? (
                    <InfoLine icon="fa-solid fa-crown">
                        Dirigé par <a href={`/commerce/${dirigeant.id}`} className="link link-hover">{dirigeant.title}</a>
                    </InfoLine>
                ) : null}
                fonctions={FctModify}
                ariane={[{ label: "Commerces", href: "/commerces" }, dirigeant && { label: dirigeant.title, href: `/commerce/${dirigeant.id}` }, { label: commerce.title }]}
            />
            <SommaireFiche />

            {/* Corps en deux colonnes (charte « Chancellerie ») : le contenu à gauche, les chiffres clés et les informations
                courtes à droite. Sur téléphone, la colonne de droite passe au-dessus du contenu. */}
            <div className="fiche grid grid-cols-1 lg:grid-cols-3 gap-x-10 w-full items-start">
                <div className="lg:col-span-2 flex flex-col gap-2 min-w-0">
                    <TitleH2 text="Présentation" icon="fas fa-pen-nib" />
                    <MarkdownTextEditor value={commerce.description ? commerce.description : 'Aucune description'} />

                    <DescriptionLongue type="commerce" id={commerce.id} auth={auth} />

                    <TitleH2 text="Magasins" icon="fas fa-store" fonctions={FctMagasins} aide="commerce" />
                    {visibleMagasins.length === 0 ? (
                        <div className="w-full">
                            <i>Ce commerce n'a encore aucun magasin.</i>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full">
                            {visibleMagasins.map((magasin) => (
                                <MagasinCard
                                    key={magasin.id}
                                    magasin={magasin}
                                    dimension={dimensions.find((dimension) => dimension.id === magasin.dimension_id)}
                                    ville={villes.find((ville) => ville.id === magasin.ville_id)}
                                    auth={auth}
                                />
                            ))}
                        </div>
                    )}

                    {visibleDiriges.length > 0 ? (
                        <>
                            <TitleH2 text="Commerces dirigés" icon="fas fa-crown" />
                            <div className="flex flex-col gap-4 w-full">
                                {visibleDiriges.map(({ commerce: dirige, fondateur: dirigeFondateur, members: dirigeMembers, magasins: dirigeMagasins }) => {
                                    // Les droits sur ce commerce valent pour ses commerces dirigés
                                    const dirigeAuth = auth || checkMemberAuth(dirigeMembers || []);
                                    const dirigeVisibleMagasins = (dirigeMagasins || []).filter((magasin) => magasin.is_public || dirigeAuth);
                                    return (
                                        <div key={dirige.id} className="flex flex-col gap-2 w-full">
                                            <a href={`/commerce/${dirige.id}`} className="flex flex-row flex-wrap items-center gap-2 px-2 font-bold hover:underline">
                                                <FontAwesomeIcon icon="fa-solid fa-shop" />
                                                <span>{dirige.title}</span>
                                                {dirigeFondateur ? <span className="font-normal text-sm opacity-70">· {dirigeFondateur.full_name || dirigeFondateur.username}</span> : null}
                                            </a>
                                            {dirigeVisibleMagasins.length === 0 ? (
                                                <i className="px-2 text-sm opacity-70">Aucun magasin.</i>
                                            ) : dirigeVisibleMagasins.map((magasin) => (
                                                <MagasinCard
                                                    key={magasin.id}
                                                    magasin={magasin}
                                                    dimension={dimensions.find((dimension) => dimension.id === magasin.dimension_id)}
                                                    ville={villes.find((ville) => ville.id === magasin.ville_id)}
                                                    auth={auth}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : null}

                    <LivresLiesSection type="commerce" id={commerce.id} />
                    <LivresLiesSection type="commerce" id={commerce.id} support="journal" />
                </div>
                <aside className="flex flex-col gap-2 min-w-0 order-first lg:order-none">
                    <div className="flex flex-col gap-2 mt-4 lg:mt-7">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 bg-base-200 rounded-3xl p-2">
                            <Stat icon="fa-solid fa-store" label={visibleMagasins.length > 1 ? "Magasins" : "Magasin"} value={visibleMagasins.length} />
                            <Stat icon="fa-solid fa-building" label={villeSiege ? `Siège · ${villeSiege.title}` : "Siège"} value={siege ? siege.title : "—"} />
                        </div>
                    </div>

                    <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
                    <div className="flex flex-row flex-wrap gap-2 w-full">
                        {sortedMembers.length > 0 ? (
                            sortedMembers.map((member) => (
                                <MemberButton
                                    key={member.user_id}
                                    member={member}
                                    editConfig={commerceMemberEditModal}
                                    // Fondateur : transfert par lui-même ou un administrateur du site ; autres membres : Fondateur / Admin
                                    auth={member.role === "Fondateur" ? (member.user_id === user?.id || Boolean(user?.is_admin)) : auth}
                                    onDelete={handleMemberDelete}
                                    onModifyMember={handleMemberModify}
                                    onTransfer={() => showModalID(TRANSFER_MODAL_ID)}
                                />
                            ))
                        ) : (
                            <i>Aucun membre pour ce commerce.</i>
                        )}
                    </div>
                    <JoinHint members={members} entity="ce commerce" />
                </aside>
            </div>
        </>
    ) : null;

    return (
        <>
            <Navbar active="commerces" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !commerce || hidden ? (
                        <>
                            <TitleH1 text="Commerce introuvable" icon="fas fa-shop" btn={btnReturn} />
                            <p>Ce commerce n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    {auth ? (
                        <>
                            <DynamicModal config={commerceModal} mode="edit" onSubmit={(data) => setCommerce(data.commerce ?? commerce)} onDelete={() => navigate('/commerces')} />
                            <DynamicModal config={commerceMemberModal} mode="add" onSubmit={addMember} />
                            <TransferFounderModal id={TRANSFER_MODAL_ID} entity="commerce" entityId={id} members={members} onTransfer={handleFounderTransfer} />
                            <DynamicModal config={magasinModal} mode="add" onSubmit={reload} />
                            {[...magasins, ...diriges.flatMap((dirige) => dirige.magasins || [])].map((magasin) => (
                                <DynamicModal key={magasin.id} config={magasinModal} mode="edit" local={{ id: magasin.id }} onSubmit={reload} onDelete={reload} />
                            ))}
                        </>
                    ) : null}
                </div>
            </main>
        </>
    );
}
