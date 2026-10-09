import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import DynamicModal from "@/components/modals/DynamicModal";
import DynamicNavbar from "@/components/layout/DynamicNavbar";
import SkeletonCivilisation from "@/components/civilisations/SkeletonCivilisation";
import GrimoireHero from "@/components/layout/GrimoireHero";
import ListCard from "@/components/ui/ListCard";
import ListCardTree from "@/components/ui/ListCardTree";
import { plural } from "@/utils/plural";

import { showModal } from "@/utils/showModal";
import { requireLogin } from "@/utils/requireLogin";
import { commerceModal } from "@/config/modals/commerce";
import { getCartographies, getCommerces, getDimensions, getMarches, getVilles } from "@/services/api";
import { dansLaZone } from "@/utils/cartographie";
import ZoneCommercialeCard from "@/components/commerces/ZoneCommercialeCard";
import FoireCard from "@/components/commerces/FoireCard";
import TitleH2 from "@/components/ui/TitleH2";
import EtatVide from '@/components/ui/EtatVide';
import MonnaieOfficielle from '@/components/monnaie/MonnaieOfficielle';
import OuAcheter from '@/components/commerces/OuAcheter';
import BarreFiltres from '@/components/ui/BarreFiltres';
import { correspond, normalize, parDate, parNombre, parTitre, useFiltresMemorises } from '@/utils/filtres';

// ===== Filtres (BarreFiltres) =====
const FILTRES_DEFAUT = { recherche: '', statut: 'tous', ville: 'toutes', tri: 'titre-asc', visibilite: 'tous', mesCommerces: false };

const STATUTS = {
    tous: 'Tous les commerces',
    independants: 'Indépendants',
    dirigeants: "Qui en dirigent d'autres",
    diriges: 'Dirigés',
};
const VISIBILITES = { tous: 'Publics et privés', publics: 'Publics seulement', prives: 'Privés seulement' };

const TRIS = {
    'titre-asc': { label: 'Nom : A → Z', compare: parTitre((item) => item.commerce.title, 1) },
    'titre-desc': { label: 'Nom : Z → A', compare: parTitre((item) => item.commerce.title, -1) },
    'magasins-desc': { label: 'Plus de magasins', compare: parNombre((item) => (item.magasins || []).length, -1) },
    'membres-desc': { label: 'Plus de membres', compare: parNombre((item) => (item.members || []).length, -1) },
    'fondation-asc': { label: 'Fondation RP : anciens', compare: parDate((item) => item.commerce.date_founded, 1) },
    'fondation-desc': { label: 'Fondation RP : récents', compare: parDate((item) => item.commerce.date_founded, -1) },
};
const TRI_LIBELLES = Object.fromEntries(Object.entries(TRIS).map(([value, { label }]) => [value, label]));

const estDirige = (commerce) => commerce.is_commerce_dirigeant === false && Boolean(commerce.dirigeant_commerce_id) && commerce.dirigeant_commerce_id !== commerce.id;

// Sur des commerces déjà visibles : recherche (nom, description, fondateur, magasins et leurs villes), statut, ville d'un
// magasin, visibilité choisie, « mes commerces » et tri. villes : Map des villes publiques.
const filtrerCommerces = (visibles, filtres, villeFiltre, villes, user) => {
    const query = normalize(filtres.recherche.trim());
    const dirigeants = new Set(visibles.filter(({ commerce }) => estDirige(commerce)).map(({ commerce }) => commerce.dirigeant_commerce_id));
    return visibles
        .filter(({ commerce, fondateur, magasins }) => correspond(query, [
            commerce.title,
            commerce.description,
            fondateur?.full_name,
            fondateur?.username,
            ...(magasins || []).flatMap((magasin) => [magasin.title, villes.get(magasin.ville_id)?.title]),
        ]))
        .filter(({ commerce }) => ({
            tous: true,
            independants: !estDirige(commerce),
            dirigeants: dirigeants.has(commerce.id),
            diriges: estDirige(commerce),
        })[filtres.statut])
        .filter(({ magasins }) => villeFiltre === 'toutes' || (magasins || []).some((magasin) => String(magasin.ville_id) === villeFiltre))
        .filter(({ commerce }) => filtres.visibilite === 'tous' || (filtres.visibilite === 'prives') === !commerce.is_public)
        .filter(({ members }) => !filtres.mesCommerces || (members || []).some((member) => member.user_id === user?.id))
        .sort(TRIS[filtres.tri].compare);
};

// Regroupe les commerces dirigés (is_commerce_dirigeant false + dirigeant_commerce_id) sous leur dirigeant, dans l'ordre
// reçu (tri). Un commerce dirigé dont le dirigeant n'est pas affiché (privé ou écarté par les filtres) reste à la racine.
const buildCommerceTree = (list) => {
    const parIdentifiant = new Map(list.map((item) => [item.commerce.id, item]));
    const racines = [];
    const diriges = new Map();

    list.forEach((item) => {
        const dirigeantId = item.commerce.dirigeant_commerce_id;
        if (item.commerce.is_commerce_dirigeant === false && dirigeantId && dirigeantId !== item.commerce.id && parIdentifiant.has(dirigeantId)) {
            diriges.set(dirigeantId, [...(diriges.get(dirigeantId) || []), item]);
        } else {
            racines.push(item);
        }
    });

    return racines.map((item) => ({ item, diriges: diriges.get(item.commerce.id) || [] }));
};

// dirige : carte affichée dans le bloc de son commerce dirigeant
function CommerceCard({ commerce, fondateur, magasins, diriges = [], dirige = false }) {
    const siege = magasins.find((magasin) => magasin.is_siege);

    return (
        <ListCard
            href={`/commerce/${commerce.id}`}
            icon={dirige ? "fa-solid fa-store" : "fa-solid fa-shop"}
            title={commerce.title}
            badges={[
                // ...(diriges.length > 0 ? [{ text: "Dirigeant", className: "badge-primary" }] : []),
                // ...(dirige ? [{ text: "Dirigé", className: "badge-neutral" }] : []),
                ...(commerce.is_public ? [] : [{ text: "Privé", className: "badge-warning" }]),
            ]}
            subtitle={fondateur ? `Par ${fondateur.full_name || fondateur.username}` : "Fondateur inconnu"}
            description={commerce.description}
            stats={[
                { icon: "fa-solid fa-store", text: plural(magasins.length, "magasin") },
                ...(siege ? [{ icon: "fa-solid fa-building", text: `Siège : ${siege.title}` }] : []),
                ...(diriges.length > 0 ? [{ icon: "fa-solid fa-crown", text: `Dirige ${plural(diriges.length, "commerce")}` }] : []),
            ]}
        />
    );
}

export default function CommercesPage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const [commerces, setCommerces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [zones, setZones] = useState([]);
    const [villes, setVilles] = useState(new Map());
    const [dimensions, setDimensions] = useState(new Map());
    const [marches, setMarches] = useState({ jours: [], foires: [] });
    const [filtres, changerFiltres] = useFiltresMemorises('commerces-filtres', FILTRES_DEFAUT, { statut: STATUTS, tri: TRIS, visibilite: VISIBILITES });

    useEffect(() => {
        getCommerces()
            .then((data) => setCommerces(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Error fetching commerces:", err);
                setError(true);
            })
            .finally(() => setLoading(false));
        // Zones commerciales (marchés, quartiers marchands) des villes publiques
        Promise.all([getCartographies().catch(() => []), getVilles().catch(() => []), getDimensions().catch(() => [])]).then(([formes, listeVilles, listeDimensions]) => {
            setDimensions(new Map((Array.isArray(listeDimensions) ? listeDimensions : []).map((dimension) => [dimension.id, dimension])));
            const publiques = new Map((Array.isArray(listeVilles) ? listeVilles : []).filter((ville) => ville.is_public !== false).map((ville) => [ville.id, ville]));
            setVilles(publiques);
            setZones((Array.isArray(formes) ? formes : []).filter((forme) => forme.type === "commerciale" && publiques.has(forme.type_id)));
        });
        // Jours de marché des zones et foires à venir des villes publiques
        getMarches().then(setMarches).catch(() => { });
    }, []);

    // Un commerce privé n'est visible que par ses membres et les administrateurs
    const visibles = commerces
        .filter(({ commerce, members }) => commerce.is_public || user?.is_admin || (members || []).some((member) => member.user_id === user?.id));

    // Filtre « ville » : les villes publiques où un commerce visible a un magasin. Une ville gardée qui n'y figure plus
    // (ou pas encore, pendant le chargement des villes) est ignorée.
    const villesDesCommerces = [
        ['toutes', 'Toutes les villes'],
        ...[...villes.values()]
            .filter((ville) => visibles.some(({ magasins }) => (magasins || []).some((magasin) => magasin.ville_id === ville.id)))
            .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
            .map((ville) => [String(ville.id), ville.title]),
    ];
    const villeFiltre = villesDesCommerces.some(([value]) => value === filtres.ville) ? filtres.ville : 'toutes';
    const affiches = filtrerCommerces(visibles, filtres, villeFiltre, villes, user);

    // Boutiques des zones : magasins publics des commerces publics, situés à l'intérieur de la zone
    const boutiques = commerces
        .filter(({ commerce }) => commerce.is_public)
        .flatMap(({ commerce, magasins }) => (magasins || []).filter((magasin) => magasin.is_public !== false).map((magasin) => ({ magasin, commerce })));
    // Filtre « ville » de la recherche : seulement les villes qui ont une boutique
    const villesMarchandes = new Map([...villes].filter(([id]) => boutiques.some(({ magasin }) => magasin.ville_id === id)));
    const boutiquesDe = (zone) => boutiques.filter(({ magasin }) => magasin.dimension_id === zone.dimension_id && dansLaZone(zone, magasin.x, magasin.z));
    const zonesTriees = [...zones].sort((a, b) => (villes.get(a.type_id)?.title || "").localeCompare(villes.get(b.type_id)?.title || "") || (a.title || "").localeCompare(b.title || ""));

    const addCommerce = (data) => {
        if (!data?.commerce) return;
        setCommerces((prev) => [...prev, { commerce: data.commerce, fondateur: data.fondateur ?? null, members: data.members ?? [], magasins: data.magasins ?? [] }]);
    };

    return (
        <>
            <Navbar active="commerces" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-shop"
                        title="Les Commerces de Tetrago"
                        description="Échoppes, comptoirs et grandes enseignes : découvrez les commerces des joueurs, leurs magasins et ce qu'ils vendent à travers le monde. Ouvrez le vôtre."
                        topRight={
                            <button onClick={() => requireLogin(() => showModal(commerceModal, "add"), "ouvrir un commerce")} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Nouveau commerce" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                <span className="flex">Commerce</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    {/* <DynamicNavbar active_id="commerces" /> */}
                    <MonnaieOfficielle compact />
                    <OuAcheter villes={villesMarchandes} />

                    <TitleH2 text="Commerces" icon="fas fa-shop" />
                    <BarreFiltres
                        filtres={{ ...filtres, ville: villeFiltre }}
                        defauts={FILTRES_DEFAUT}
                        onChange={changerFiltres}
                        recherche={{ placeholder: "Nom, fondateur, magasin, ville…", label: "Rechercher un commerce" }}
                        selects={[
                            { name: 'statut', label: 'Statut', options: STATUTS },
                            { name: 'ville', label: "Ville d'un magasin", options: villesDesCommerces, className: 'sm:w-48' },
                            { name: 'tri', label: 'Trier', options: TRI_LIBELLES, className: 'sm:w-56' },
                            ...(user ? [{ name: 'visibilite', label: 'Visibilité', options: VISIBILITES, className: 'sm:w-48' }] : []),
                        ]}
                        toggles={user ? [{ name: 'mesCommerces', label: 'Mes commerces' }] : []}
                    />

                    {loading ? (
                        <div className="flex flex-col gap-4 w-full">
                            <SkeletonCivilisation />
                            <SkeletonCivilisation />
                        </div>
                    ) : error ? (
                        <div className="alert alert-error w-full">
                            <span>Impossible de récupérer la liste des commerces.</span>
                        </div>
                    ) : visibles.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-shop"
                            texte="Aucun commerce n'est encore ouvert."
                            aide="Un commerce regroupe des marchands et ses magasins, implantés dans les villes du monde."
                            action={{ label: "Ouvrir un commerce", icon: "fa-solid fa-plus", onClick: () => requireLogin(() => showModal(commerceModal, "add"), "ouvrir un commerce") }}
                        />
                    ) : affiches.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-magnifying-glass"
                            texte="Aucun commerce ne correspond à vos filtres."
                            action={{ label: "Effacer les filtres", icon: "fa-solid fa-xmark", onClick: () => changerFiltres(FILTRES_DEFAUT) }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 w-full">
                            {buildCommerceTree(affiches).map(({ item: { commerce, fondateur, magasins }, diriges }) => (
                                diriges.length > 0 ? (
                                    <ListCardTree
                                        key={commerce.id}
                                        parent={<CommerceCard commerce={commerce} fondateur={fondateur} magasins={magasins || []} diriges={diriges} />}
                                        label={{ icon: "fa-solid fa-crown", text: `Commerces dirigés par ${commerce.title}` }}
                                        items={diriges.map((dirige) => ({
                                            key: dirige.commerce.id,
                                            node: <CommerceCard commerce={dirige.commerce} fondateur={dirige.fondateur} magasins={dirige.magasins || []} dirige />,
                                        }))}
                                    />
                                ) : (
                                    <CommerceCard key={commerce.id} commerce={commerce} fondateur={fondateur} magasins={magasins || []} />
                                )
                            ))}
                        </div>
                    )}

                    {marches.foires.length > 0 && (
                        <>
                            <TitleH2 text="Prochaines foires" icon="fas fa-tents" aide="foire" />
                            <div id="foires" className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full items-start scroll-mt-24">
                                {marches.foires.map((foire) => <FoireCard key={foire.id} foire={foire} dimension={dimensions.get(foire.dimension_id)} afficherVille />)}
                            </div>
                        </>
                    )}

                    {zonesTriees.length > 0 && (
                        <>
                            <TitleH2 text="Zones commerciales" icon="fas fa-store" aide="commerciale" />
                            <p className="text-sm opacity-70 px-1 w-full">Marchés et quartiers marchands des villes, avec les boutiques qui s'y tiennent.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full items-start">
                                {zonesTriees.map((zone) => (
                                    <ZoneCommercialeCard key={zone.id} zone={zone} ville={villes.get(zone.type_id)} dimension={dimensions.get(zone.dimension_id)} boutiques={boutiquesDe(zone)} marche={marches.jours.find((marche) => marche.cartographie_id === zone.id)} apercu={false} />
                                ))}
                            </div>
                        </>
                    )}

                    {user ? <DynamicModal config={commerceModal} mode="add" onSubmit={addCommerce} /> : null}
                </div>
            </main>
        </>
    );
}
