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
import { navbarConfig } from "@/config/navbar";
import { getCommerces } from "@/services/api";

// Regroupe les commerces dirigés (is_commerce_dirigeant false + dirigeant_commerce_id) sous leur dirigeant.
// Un commerce dirigé dont le dirigeant n'est pas visible reste à la racine.
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

    useEffect(() => {
        getCommerces()
            .then((data) => setCommerces(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Error fetching commerces:", err);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    // Un commerce privé n'est visible que par ses membres et les administrateurs
    const visibles = commerces
        .filter(({ commerce, members }) => commerce.is_public || user?.is_admin || (members || []).some((member) => member.user_id === user?.id))
        .sort((a, b) => a.commerce.title.localeCompare(b.commerce.title));

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
                        description="Échoppes, comptoirs et grandes enseignes : découvrez les commerces des joueurs et leurs magasins à travers le monde. Ouvrez le vôtre."
                        topRight={
                            <button onClick={() => requireLogin(() => showModal(commerceModal, "add"), "ouvrir un commerce")} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Nouveau commerce" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                <span className="flex">Commerce</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    <DynamicNavbar active_id="commerces" navigation={navbarConfig.navigation} shadow="md" />

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
                        <p className="italic opacity-70">Aucun commerce disponible.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 w-full">
                            {buildCommerceTree(visibles).map(({ item: { commerce, fondateur, magasins }, diriges }) => (
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

                    {user ? <DynamicModal config={commerceModal} mode="add" onSubmit={addCommerce} /> : null}
                </div>
            </main>
        </>
    );
}
