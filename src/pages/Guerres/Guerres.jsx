import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";
import GrimoireHero from "../../components/Layouts/GrimoireHero";
import SkeletonCivilisation from "../../components/Objects/SkeletonCivilisation";
import ListCard from "../../components/Objects/ListCard";
import TitleH2 from "../../components/Objects/TitleH2";
import FormModal from "../../components/Modals/FormModal";

import { Config_RP_Navbar } from "../../components/Navigation/Config_RP_Navbar";
import { showModalID } from "../../components/Functions/showModal";
import { requireLogin } from "../../components/Functions/requireLogin";
import { GUERRE_STATUTS, GUERRE_TYPES, formatDate, managedEntities, runAction, toOptions } from "../../components/Functions/conflits";
import { getSessionUser } from "../../services/session";
import { apiRequest, getCivilisations, getGuerres, getMesGuerres, getReligions } from "../../services/api";

const DECLARE_MODAL_ID = "guerre-declare-modal";

const leaders = (camps) => ({
    attaquant: (camps?.attaquant ?? []).find((b) => b.is_leader)?.entite,
    defenseur: (camps?.defenseur ?? []).find((b) => b.is_leader)?.entite,
});

const engagedCount = (camp) => (camp ?? []).filter((b) => b.status === "engage").length;

function GuerreCard({ guerre, camps }) {
    const type = GUERRE_TYPES[guerre.type] ?? GUERRE_TYPES.Militaire;
    const statut = GUERRE_STATUTS[guerre.status] ?? { label: guerre.status, badge: "badge-ghost" };
    const { attaquant, defenseur } = leaders(camps);
    const periode = guerre.status === "terminee"
        ? `Du ${formatDate(guerre.date_debut) ?? "?"} au ${formatDate(guerre.date_fin) ?? "?"}`
        : guerre.date_debut ? `Depuis le ${formatDate(guerre.date_debut)}` : `Déclarée le ${formatDate(guerre.declared_at)}`;

    return (
        <ListCard
            href={`/guerre/${guerre.id}`}
            icon={type.icon}
            iconColor={guerre.status === "en_cours" ? "#b91c1c" : null}
            title={guerre.title}
            badges={[{ text: type.label, className: "badge-ghost" }, { text: statut.label, className: statut.badge }]}
            subtitle={attaquant && defenseur ? `${attaquant.title} contre ${defenseur.title}` : null}
            description={guerre.status === "terminee" && guerre.issue ? `Issue : ${guerre.issue}` : guerre.casus_belli}
            stats={[
                { icon: "fa-solid fa-people-group", text: `${engagedCount(camps?.attaquant)} contre ${engagedCount(camps?.defenseur)}` },
                { icon: "fa-solid fa-calendar", text: periode },
            ]}
        />
    );
}

export default function GuerresPage() {
    const navigate = useNavigate();
    const user = getSessionUser();
    const [guerres, setGuerres] = useState([]);
    const [mine, setMine] = useState({ a_valider: [], mes_guerres: [], appels: [] });
    const [civilisations, setCivilisations] = useState([]);
    const [religions, setReligions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        getGuerres()
            .then((data) => setGuerres(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Error fetching guerres:", err);
                setError(true);
            })
            .finally(() => setLoading(false));
        if (localStorage.getItem("token")) {
            getMesGuerres()
                .then((data) => setMine({ a_valider: [], mes_guerres: [], appels: [], ...data }))
                .catch((err) => console.error("Error fetching my guerres:", err));
        }
    }, [reloadKey]);

    useEffect(() => {
        getCivilisations().then((data) => setCivilisations(Array.isArray(data) ? data : [])).catch((err) => console.error(err));
        getReligions().then((data) => setReligions(Array.isArray(data) ? data : [])).catch((err) => console.error(err));
    }, []);

    const managedCivs = managedEntities(civilisations, "civilisation");
    const managedReligions = managedEntities(religions, "religion");
    const managedCivIds = new Set(managedCivs.map((item) => item.id));
    const managedReligionIds = new Set(managedReligions.map((item) => item.id));
    const allCivs = civilisations.map((item) => item.civilisation).filter((item) => item.is_public !== false || managedCivIds.has(item.id));
    const allReligions = religions.map((item) => item.religion).filter((item) => item.is_public !== false || managedReligionIds.has(item.id));

    const enCours = guerres.filter(({ guerre }) => guerre.status === "en_cours");
    const terminees = guerres.filter(({ guerre }) => guerre.status === "terminee");

    // À traiter : déclarations à valider (modérateurs), ses déclarations non validées, appels aux armes
    const aValiderIds = new Set(mine.a_valider.map(({ guerre }) => guerre.id));
    const aTraiter = [...mine.a_valider, ...mine.mes_guerres.filter(({ guerre }) => !aValiderIds.has(guerre.id))];

    const openDeclare = () => requireLogin(() => {
        if (managedCivs.length === 0 && managedReligions.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Un camp est nécessaire",
                text: "Une guerre se déclare au nom d'une civilisation (guerre militaire) ou d'une religion (guerre de religion) dont vous êtes fondateur ou admin.",
            });
            return;
        }
        showModalID(DECLARE_MODAL_ID);
    }, "déclarer une guerre");

    const declareFields = [
        { name: "title", label: "Nom de la guerre", type: "text", required: true, placeholder: "Ex. Guerre des Trois Rivières" },
        {
            name: "type", label: "Type", type: "radio", required: true, resets: ["attaquant_id", "defenseur_id"],
            options: [{ value: "Militaire", label: "Guerre militaire" }, { value: "Religion", label: "Guerre de religion" }],
            help: (values) => values.type === "Religion" ? "Entre religions ; des civilisations pourront rejoindre chaque camp." : "Entre civilisations ; leurs alliés pourront être appelés aux armes.",
        },
        {
            name: "attaquant_id", label: "Au nom de (camp attaquant)", type: "select", required: true,
            options: (values) => toOptions(values.type === "Religion" ? managedReligions : managedCivs),
            empty: (values) => values.type === "Religion" ? "Vous ne dirigez aucune religion." : "Vous ne dirigez aucune civilisation.",
        },
        {
            name: "defenseur_id", label: "Contre (camp défenseur)", type: "select", required: true,
            options: (values) => toOptions((values.type === "Religion" ? allReligions : allCivs).filter((item) => String(item.id) !== String(values.attaquant_id))),
        },
        { name: "casus_belli", label: "Casus belli", type: "textarea", required: true, placeholder: "Pourquoi cette guerre ? Offense, revendication, schisme…" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Enjeux, objectifs, contexte RP (Markdown accepté)" },
    ];

    const declare = async (values) => {
        const data = await apiRequest("POST", "/guerres/declarer", {
            ...values,
            attaquant_id: Number(values.attaquant_id),
            defenseur_id: Number(values.defenseur_id),
        });
        await Swal.fire({ icon: "info", title: "Déclaration envoyée", text: "Votre déclaration reste privée jusqu'à sa validation par un modérateur RP. Vous pouvez déjà appeler vos alliés." });
        navigate(`/guerre/${data.guerre.id}`);
    };

    const answerCall = async (appel, accepter) => {
        const result = await runAction(() => apiRequest("PUT", `/guerres/${appel.guerre.id}/appels/${appel.belligerant_id}/repondre`, { accepter }));
        if (result) setReloadKey((key) => key + 1);
    };

    return (
        <>
            <Navbar active="guerres" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-shield-halved"
                        title="Les Guerres de Tetrago"
                        description="Les guerres se déclarent, elles ne s'improvisent pas : chaque conflit est validé par un modérateur RP, puis consigné dans la mémoire du monde, qu'il s'achève par la victoire, la paix ou la ruine."
                        topRight={
                            <button onClick={openDeclare} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Déclarer une guerre" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                <span className="flex">Guerre</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />
                    <DynamicNavbar active_id="guerres" navigation={Config_RP_Navbar.navigation} shadow="md" />

                    {mine.appels.length > 0 ? (
                        <>
                            <TitleH2 text="Appels aux armes" icon="fas fa-bullhorn" />
                            <ul className="flex flex-col gap-2 w-full">
                                {mine.appels.map((appel) => (
                                    <li key={appel.belligerant_id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-base-200 rounded-2xl p-3">
                                        <span className="flex-1 min-w-0">
                                            <strong>{appel.entite.title}</strong> est appelée à rejoindre le camp {appel.camp === "attaquant" ? "attaquant" : "défenseur"} de{" "}
                                            <a href={`/guerre/${appel.guerre.id}`} className="link link-hover font-semibold">{appel.guerre.title}</a>
                                        </span>
                                        <div className="flex flex-row gap-1">
                                            <button type="button" className="btn btn-sm btn-error" onClick={() => answerCall(appel, true)}>Rejoindre</button>
                                            <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => answerCall(appel, false)}>Décliner</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : null}

                    {aTraiter.length > 0 ? (
                        <>
                            <TitleH2 text={mine.a_valider.length > 0 ? "Déclarations à traiter" : "Vos déclarations en attente"} icon="fas fa-gavel" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {aTraiter.map(({ guerre, camps }) => <GuerreCard key={guerre.id} guerre={guerre} camps={camps} />)}
                            </div>
                        </>
                    ) : null}

                    {loading ? (
                        <div className="flex flex-col gap-4 w-full">
                            <SkeletonCivilisation />
                            <SkeletonCivilisation />
                        </div>
                    ) : error ? (
                        <div className="alert alert-error w-full">
                            <span>Impossible de récupérer la liste des guerres.</span>
                        </div>
                    ) : (
                        <>
                            <TitleH2 text="Guerres en cours" icon="fas fa-fire" />
                            {enCours.length === 0 ? (
                                <i className="w-full">Aucune guerre ne fait rage pour le moment.</i>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {enCours.map(({ guerre, camps }) => <GuerreCard key={guerre.id} guerre={guerre} camps={camps} />)}
                                </div>
                            )}

                            <TitleH2 text="Archives des guerres" icon="fas fa-book-skull" />
                            {terminees.length === 0 ? (
                                <i className="w-full">Aucune guerre n'est encore entrée dans l'histoire.</i>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {terminees.map(({ guerre, camps }) => <GuerreCard key={guerre.id} guerre={guerre} camps={camps} />)}
                                </div>
                            )}
                        </>
                    )}

                    {user ? (
                        <FormModal
                            key={`${managedCivs.length}-${managedReligions.length}-${allCivs.length}-${allReligions.length}`}
                            id={DECLARE_MODAL_ID}
                            title="Déclarer une guerre"
                            intro="La déclaration reste privée jusqu'à sa validation par un modérateur RP, qui encadre ses enjeux et son issue."
                            fields={declareFields}
                            initialValues={{ type: managedCivs.length === 0 ? "Religion" : "Militaire" }}
                            submitLabel="Déclarer la guerre"
                            submitIcon="fas fa-shield-halved"
                            submitClass="btn-error"
                            onSubmit={declare}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
