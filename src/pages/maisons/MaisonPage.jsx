import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import InfoLine from "@/components/ui/InfoLine";
import Stat from "@/components/ui/Stat";
import EnTeteFiche from "@/components/ui/EnTeteFiche";
import Blason from "@/components/ui/Blason";
import SommaireFiche from "@/components/ui/SommaireFiche";
import FormModal from "@/components/modals/FormModal";
import PersonnageAvatar from "@/components/personnages/PersonnageAvatar";
import ArbreMaison from "@/components/lignees/ArbreMaison";

import { usePageTitle } from "@/utils/pageTitle";
import { showModalID } from "@/utils/showModal";
import { isModerateur, runAction } from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import { dateRp, vieRp, MAISON_COULEUR_DEFAUT, MAISON_ICON_DEFAUT } from "@/config/lignees";
import { couleurValide, encreSur, metalSur } from "@/utils/couleurFiche";
import { deleteMaison, getCivilisations, getMaison, rejoindreMaison, retirerMembreMaison, updateMaison } from "@/services/api";
import { PERSONNAGE_STATUTS, libellePersonnage, personnagesChoisissables } from "@/utils/personnages";
import { maisonChamps, maisonCorps, maisonValeurs } from "@/pages/maisons/maisonForm";

// ===== Fiche d'une maison noble =====
// Blason, devise, chef, membres et arbre de la lignée (Shard-API crud_lignees). Chaque joueur y fait entrer ou sortir
// ses personnages ; le chef, le fondateur de la maison et les modérateurs RP la gèrent (chef, blason, exclusions).

const EDIT_MODAL_ID = "maison-edit-modal";

export default function MaisonPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [mesPersonnages, setMesPersonnages] = useState([]);
    const [civilisations, setCivilisations] = useState([]);

    const maison = data?.maison;
    usePageTitle(maison ? `Maison ${maison.title}` : null);

    useEffect(() => {
        getMaison(id)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    useEffect(() => {
        if (!user) return;
        // Ses personnages ; tous ceux du site pour un administrateur
        personnagesChoisissables(user).then(setMesPersonnages).catch(() => { });
        getCivilisations()
            .then((liste) => setCivilisations((Array.isArray(liste) ? liste : []).map((item) => item.civilisation).filter((civ) => civ.is_public !== false)
                .map((civ) => ({ value: civ.id, label: civ.title })).sort((a, b) => a.label.localeCompare(b.label))))
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reload = () => setReloadKey((key) => key + 1);
    const membres = data?.membres ?? [];
    const canManage = Boolean(user && maison && (isModerateur(user) || maison.created_by === user.id || maison.chef?.user_id === user.id));
    const aFaireEntrer = mesPersonnages.filter((fiche) => fiche.personnage.maison_id !== maison?.id);

    const faireEntrer = async () => {
        if (aFaireEntrer.length === 0) {
            Swal.fire({ icon: "info", title: "Aucun personnage à faire entrer", text: "Tous vos personnages sont déjà membres de la maison, ou vous n'en avez pas encore." });
            return;
        }
        const answer = await Swal.fire({
            icon: "question",
            title: `Entrer dans la maison ${maison.title}`,
            text: "Un personnage déjà membre d'une autre maison la quitte.",
            input: "select",
            inputOptions: new Map(aFaireEntrer.map((fiche) => [String(fiche.personnage.id), libellePersonnage(fiche, user)])),
            showCancelButton: true,
            confirmButtonText: "Entrer",
            cancelButtonText: "Annuler",
        });
        if (answer.isConfirmed && await runAction(() => rejoindreMaison(maison.id, Number(answer.value)))) reload();
    };

    const retirer = async (membre) => {
        const sien = membre.user_id === user?.id;
        const result = await runAction(() => retirerMembreMaison(maison.id, membre.id), {
            confirm: { title: sien ? `${membre.name} quitte la maison ?` : `Exclure ${membre.name} de la maison ?`, text: "Ses liens de parenté restent sur sa fiche.", button: sien ? "Quitter" : "Exclure" },
        });
        if (result) reload();
    };

    const enregistrer = async (values) => {
        const data = await updateMaison(maison.id, maisonCorps(values));
        Swal.fire({ icon: "success", title: data.text });
        reload();
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: canManage, function: () => showModalID(EDIT_MODAL_ID) },
        {
            id: 2, title: "Dissoudre", icon: "fas fa-trash", class: "bg-base-200 hover:bg-base-300 text-error", connected: true, authorisation: canManage,
            function: async () => {
                const result = await runAction(() => deleteMaison(maison.id), {
                    confirm: { title: `Dissoudre la maison ${maison.title} ?`, text: "Ses membres redeviennent sans maison ; leurs liens de parenté sont conservés.", button: "Dissoudre" },
                });
                if (result) navigate("/maisons");
            },
        },
    ];
    const FctMembres = [
        { id: 1, title: "Faire entrer", icon: "fas fa-user-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, tooltip: { text: "Faire entrer un de vos personnages", position: "left" }, function: faireEntrer },
    ];
    const btnReturn = { text: "Retour aux maisons", icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: "/maisons" };
    const couleur = couleurValide(maison?.couleur) ?? MAISON_COULEUR_DEFAUT;

    return (
        <>
            <Navbar active="maisons" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !maison ? (
                        <>
                            <TitleH1 text="Maison introuvable" icon="fas fa-chess-king" btn={btnReturn} />
                            <p>Cette maison n'existe pas ou a été dissoute.</p>
                        </>
                    ) : (
                        <>
                            {/* En-tête aux couleurs de la maison : son blason (meuble sur sa couleur), cerné d'or pour se détacher de l'aplat */}
                            <EnTeteFiche
                                couleur={couleur}
                                embleme={<Blason champ={couleur} meuble={encreSur(couleur)} contour={metalSur(couleur)} icon={maison.icon || MAISON_ICON_DEFAUT} iconFallback={MAISON_ICON_DEFAUT} titre={`Blason de la maison ${maison.title}`} />}
                                surtitre={["Maison", maison.civilisation?.title, maison.date_fondation ? `fondée le ${dateRp(maison.date_fondation)}` : null].filter(Boolean).join(" · ")}
                                titre={`Maison ${maison.title}`}
                                devise={maison.devise}
                                infos={
                                    <>
                                        <InfoLine icon="fa-solid fa-crown">
                                            {maison.chef ? <>Chef : <a href={`/personnage/${maison.chef.id}`} className="link link-hover font-semibold">{maison.chef.name}</a></> : "Pas de chef désigné"}
                                        </InfoLine>
                                        {maison.civilisation && (
                                            <InfoLine icon="fa-solid fa-flag">
                                                <a href={`/civilisation/${maison.civilisation.id}`} className="link link-hover">{maison.civilisation.title}</a>
                                            </InfoLine>
                                        )}
                                    </>
                                }
                                fonctions={FctModify}
                                ariane={[{ label: "Maisons", href: "/maisons" }, { label: maison.title }]}
                            />
                            <SommaireFiche />

                            {/* Corps en deux colonnes (charte « Chancellerie ») : le contenu à gauche, les chiffres clés et les informations
                                courtes à droite. Sur téléphone, la colonne de droite passe au-dessus du contenu. */}
                            <div className="fiche grid grid-cols-1 lg:grid-cols-3 gap-x-10 w-full items-start">
                                <div className="lg:col-span-2 flex flex-col gap-2 min-w-0">
                                    {maison.description && (
                                        <>
                                            <TitleH2 text="Présentation" icon="fas fa-pen-nib" />
                                            <p className="w-full px-1 whitespace-pre-line break-words">{maison.description}</p>
                                        </>
                                    )}

                                    <TitleH2 text="Arbre de la lignée" icon="fas fa-sitemap" />
                                    <div className="w-full px-1 overflow-x-auto">
                                        {membres.length === 0 ? (
                                            <p className="opacity-70">La maison n'a encore aucun membre.</p>
                                        ) : (
                                            <ArbreMaison membres={membres} allies={data.allies} liens={data.liens} chefId={maison.chef_id} />
                                        )}
                                        <p className="text-xs opacity-60 mt-3">Les liens de parenté s'ajoutent sur la fiche de chaque personnage, section « Famille ». En pointillés : les conjoints venus d'autres maisons.</p>
                                    </div>

                                    <TitleH2 text={`Membres (${membres.length})`} icon="fas fa-users" fonctions={FctMembres} />
                                    {/* Une ligne par membre, comme la maquette : portrait et nom, rôle dans la maison, statut */}
                                    <ul className="flex flex-col w-full">
                                        {membres.map((membre) => {
                                            const statut = PERSONNAGE_STATUTS[membre.status] ?? PERSONNAGE_STATUTS.vivant;
                                            return (
                                                <li key={membre.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)_auto] items-center gap-x-4 gap-y-1 ligne-fiche">
                                                    <span className="flex flex-row items-center gap-3 min-w-0">
                                                        <PersonnageAvatar personnage={membre} size="md" />
                                                        <span className="flex flex-col min-w-0 leading-tight">
                                                            <a href={`/personnage/${membre.id}`} className="link link-hover font-bold truncate">{membre.name}</a>
                                                            {vieRp(membre) ? <span className="text-sm opacity-70 truncate">{vieRp(membre)}</span> : null}
                                                        </span>
                                                    </span>
                                                    <span className="hidden sm:inline text-sm opacity-70 truncate">{membre.id === maison.chef_id ? "Chef de maison" : "Membre"}</span>
                                                    <span className="flex flex-row items-center justify-end gap-2">
                                                        <span className={`badge badge-sm ${statut.badge}`}>{statut.label}</span>
                                                        {membre.id !== maison.chef_id && (canManage || membre.user_id === user?.id) && (
                                                            <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => retirer(membre)}>
                                                                {membre.user_id === user?.id ? "Quitter" : "Exclure"}
                                                            </button>
                                                        )}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                                <aside className="flex flex-col gap-2 min-w-0 order-first lg:order-none">
                                    <div className="grid grid-cols-2 gap-2 bg-base-200 rounded-3xl p-2 mt-4 lg:mt-7">
                                        <Stat icon="fa-solid fa-users" label={membres.length > 1 ? "Membres" : "Membre"} value={membres.length} />
                                        <Stat icon="fa-solid fa-ring" label="Alliés par mariage" value={data.allies.length} />
                                    </div>
                                </aside>
                            </div>
                        </>
                    )}

                    {maison && canManage ? (
                        <FormModal
                            key={`${EDIT_MODAL_ID}-${reloadKey}`}
                            id={EDIT_MODAL_ID}
                            title={`Modifier la maison ${maison.title}`}
                            fields={maisonChamps({ chefs: membres.map((m) => ({ value: m.id, label: m.name })), civilisations })}
                            initialValues={maisonValeurs(maison)}
                            submitLabel="Enregistrer"
                            onSubmit={enregistrer}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
