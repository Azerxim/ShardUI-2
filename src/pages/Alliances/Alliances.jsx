import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";
import GrimoireHero from "../../components/Layouts/GrimoireHero";
import SkeletonCivilisation from "../../components/Objects/SkeletonCivilisation";
import ListCard from "../../components/Objects/ListCard";
import FormModal from "../../components/Modals/FormModal";

import { Config_RP_Navbar } from "../../components/Navigation/Config_RP_Navbar";
import { showModalID } from "../../components/Functions/showModal";
import { requireLogin } from "../../components/Functions/requireLogin";
import { plural } from "../../components/Functions/plural";
import { ALLIANCE_TYPES, allianceBody, allianceFormFields, managedEntities, toOptions } from "../../components/Functions/conflits";
import { getSessionUser } from "../../services/session";
import { apiRequest, getAlliances, getCivilisations } from "../../services/api";

const CREATE_MODAL_ID = "alliance-create-modal";
const CREATE_INITIAL = { type: "Militaire", color: "#b91c1c", icon: "fa-solid fa-shield-halved", is_public: "true" };

export default function AlliancesPage() {
    const navigate = useNavigate();
    const user = getSessionUser();
    const [alliances, setAlliances] = useState([]);
    const [civilisations, setCivilisations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getAlliances()
            .then((data) => setAlliances(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Error fetching alliances:", err);
                setError(true);
            })
            .finally(() => setLoading(false));
        getCivilisations()
            .then((data) => setCivilisations(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Error fetching civilisations:", err));
    }, []);

    const managed = managedEntities(civilisations, "civilisation");
    const managedIds = new Set(managed.map((civilisation) => civilisation.id));

    // Une alliance privée n'est visible que par les dirigeants de ses civilisations membres et les administrateurs
    const visibles = alliances
        .filter(({ alliance, membres }) => alliance.is_public !== false || user?.is_admin || membres.some((membre) => managedIds.has(membre.civilisation.id)))
        .sort((a, b) => a.alliance.title.localeCompare(b.alliance.title));

    const openCreate = () => requireLogin(() => {
        if (managed.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Une civilisation est nécessaire",
                text: "Une alliance se fonde au nom d'une civilisation : il faut en être fondateur ou admin. Rejoignez ou fondez d'abord une civilisation.",
            });
            return;
        }
        showModalID(CREATE_MODAL_ID);
    }, "fonder une alliance");

    const createAlliance = async (values) => {
        const data = await apiRequest("POST", "/alliances/create", allianceBody(values));
        await Swal.fire({ icon: "success", title: "Alliance fondée", text: `${data.alliance.title} est née. Invitez maintenant d'autres civilisations.` });
        navigate(`/alliance/${data.alliance.id}`);
    };

    return (
        <>
            <Navbar active="alliances" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-handshake"
                        title="Les Alliances de Tetrago"
                        description="Pactes de sang ou traités d'ambassadeurs : les civilisations s'unissent pour se défendre et peser sur le destin du monde. Rejoignez une alliance, ou scellez la vôtre."
                        topRight={
                            <button onClick={openCreate} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Nouvelle alliance" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                <span className="flex">Alliance</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    <DynamicNavbar active_id="alliances" navigation={Config_RP_Navbar.navigation} shadow="md" />

                    {loading ? (
                        <div className="flex flex-col gap-4 w-full">
                            <SkeletonCivilisation />
                            <SkeletonCivilisation />
                        </div>
                    ) : error ? (
                        <div className="alert alert-error w-full">
                            <span>Impossible de récupérer la liste des alliances.</span>
                        </div>
                    ) : visibles.length === 0 ? (
                        <p className="italic opacity-70">Aucune alliance n'a encore été scellée.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {visibles.map(({ alliance, membres, chef_de_file }) => {
                                const type = ALLIANCE_TYPES[alliance.type] ?? ALLIANCE_TYPES.Militaire;
                                return (
                                    <ListCard
                                        key={alliance.id}
                                        href={`/alliance/${alliance.id}`}
                                        icon={alliance.icon || type.icon}
                                        iconColor={alliance.color || null}
                                        title={alliance.title}
                                        badges={[
                                            { text: alliance.type, className: type.badge },
                                            ...(alliance.is_public === false ? [{ text: "Privée", className: "badge-warning" }] : []),
                                        ]}
                                        subtitle={chef_de_file ? `Menée par ${chef_de_file.title}` : null}
                                        description={alliance.description}
                                        stats={[{ icon: "fa-solid fa-flag", text: plural(membres.length, "civilisation") }]}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {user ? (
                        <FormModal
                            key={managed.map((civilisation) => civilisation.id).join("-")}
                            id={CREATE_MODAL_ID}
                            title="Fonder une alliance"
                            fields={allianceFormFields(toOptions(managed))}
                            initialValues={{ ...CREATE_INITIAL, civilisation_id: managed.length === 1 ? String(managed[0].id) : "" }}
                            submitLabel="Fonder"
                            onSubmit={createAlliance}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
