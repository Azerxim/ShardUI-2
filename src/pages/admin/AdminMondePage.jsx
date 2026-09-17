import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import Stat from "@/components/ui/Stat";
import { getMondeResume, getDimensions, deleteMondeReleve, resoudreMondePseudos } from "@/services/api";

const MAP_URL = "https://map.beta.tetrago.fr";

// Lieux mesurés : libellé et icône par type
const LIEUX = {
    civilisation: { label: "Civilisation", icon: "fa-solid fa-flag" },
    ville: { label: "Ville", icon: "fa-solid fa-city" },
    quartier: { label: "Quartier", icon: "fa-solid fa-house-chimney" },
};

const nombre = (valeur, decimales = 0) =>
    valeur === null || valeur === undefined ? "—" : Number(valeur).toLocaleString("fr-FR", { maximumFractionDigits: decimales });

const heures = (valeur) => (valeur === null || valeur === undefined ? "—" : `${nombre(valeur)} h`);

const date = (valeur) => (valeur ? new Date(valeur).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

function Evolution({ valeur, suffixe = "" }) {
    if (!valeur) return null;
    const positif = valeur > 0;
    return (
        <span className={`text-xs font-semibold ${positif ? "text-success" : "text-error"}`}>
            {positif ? "+" : ""}{nombre(valeur)}{suffixe}
        </span>
    );
}

function AccessMessage({ text, link, label }) {
    return (
        <>
            <Navbar active="admin-monde" />
            <div className="text-center py-12 px-4">
                <p className="text-xl">{text}</p>
                <Link to={link} className="btn btn-primary mt-4">{label}</Link>
            </div>
        </>
    );
}

export default function AdminMondePage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const isAdmin = Boolean(user?.is_admin);
    const [resume, setResume] = useState(null);
    const [dimensions, setDimensions] = useState([]);
    const [releveId, setReleveId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pseudosEnCours, setPseudosEnCours] = useState(false);

    // Le chargement est signalé par le sélecteur de relevé, jamais depuis l'effet
    useEffect(() => {
        if (!isAdmin) return;
        getMondeResume(releveId)
            .then((data) => {
                setResume(data);
                setError(null);
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [isAdmin, releveId]);

    useEffect(() => {
        if (!isAdmin) return;
        getDimensions()
            .then((data) => setDimensions(Array.isArray(data) ? data : []))
            .catch(() => setDimensions([]));
    }, [isAdmin]);

    if (!user) {
        return <AccessMessage text="Vous devez être connecté pour accéder à cette page." link="/login" label="Se connecter" />;
    }
    if (!isAdmin) {
        return <AccessMessage text="Vous n'avez pas les droits nécessaires pour accéder à cette page." link="/" label="Retour à l'accueil" />;
    }

    const lienCarte = (dimensionId, x, z) => {
        const dimension = dimensions.find((dim) => dim.id === dimensionId);
        return dimension?.link ? `${MAP_URL}/${dimension.link}-civilisations#x=${x}&z=${z}&zoom=0` : null;
    };

    const supprimer = async (releve) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Supprimer ce relevé ?",
            text: `Le relevé du ${date(releve.releve_at || releve.created_at)} et son détail seront supprimés.`,
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!confirm.isConfirmed) return;
        try {
            await deleteMondeReleve(releve.id);
            setReleveId(null);
            setResume(null);
            setLoading(true);
            const data = await getMondeResume();
            setResume(data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            Swal.fire({ icon: "error", title: "Oops...", text: err.message });
        }
    };

    // Les UUID de la sauvegarde sont convertis en pseudos par playerdb.co, à la demande
    const chercherPseudos = async () => {
        setPseudosEnCours(true);
        try {
            const resultat = await resoudreMondePseudos(resume?.releve?.id);
            const data = await getMondeResume(releveId);
            setResume(data);
            Swal.fire({
                icon: resultat.trouves ? "success" : "info",
                title: "Pseudos Minecraft",
                text: resultat.trouves
                    ? `${resultat.trouves} pseudo(s) retrouvé(s) sur ${resultat.cherches}.`
                    : "Aucun pseudo supplémentaire trouvé sur playerdb.co.",
            });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Oops...", text: err.message });
        } finally {
            setPseudosEnCours(false);
        }
    };

    let content;
    if (loading) {
        content = (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    } else if (error || !resume) {
        const aucun = error?.message?.includes("relevé");
        content = (
            <div className={`alert ${aucun ? "alert-info" : "alert-error"}`}>
                <span>
                    {aucun
                        ? "Aucun relevé enregistré. Lancez la génération des cartes (scripts/map-generator/run.sh) : le monde est lu puis envoyé ici."
                        : "Impossible de récupérer les statistiques du monde."}
                </span>
            </div>
        );
    } else {
        const { releve, evolution, dimensions: mesures, lieux, zones, joueurs, releves } = resume;
        const actifs = joueurs.filter((joueur) => joueur.is_actif);
        const sansPseudo = joueurs.filter((joueur) => !joueur.pseudo);
        content = (
            <div className="flex flex-col gap-6">
                {/* Relevé affiché */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-base-200 rounded-2xl p-3 sm:p-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="font-bold text-lg">
                            {releve.world_name || "Monde"}
                            {releve.world_version ? <span className="badge badge-sm badge-neutral ml-2">{releve.world_version}</span> : null}
                        </span>
                        <span className="text-sm opacity-70">
                            Sauvegarde du {date(releve.releve_at)}, lue en {nombre(releve.duration_seconds, 1)} s
                            {releve.taille_octets ? ` (${nombre(releve.taille_octets / 1073741824, 1)} Go de régions)` : ""}
                        </span>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <select
                            className="select select-bordered select-sm"
                            value={releve.id}
                            onChange={(event) => {
                                setLoading(true);
                                setReleveId(Number(event.target.value));
                            }}
                        >
                            {releves.map((entree) => (
                                <option key={entree.id} value={entree.id}>{date(entree.releve_at || entree.created_at)}</option>
                            ))}
                        </select>
                        <button type="button" className="btn btn-sm btn-ghost btn-circle text-error tooltip tooltip-left" data-tip="Supprimer ce relevé" onClick={() => supprimer(releve)}>
                            <FontAwesomeIcon icon="fa-solid fa-trash" />
                        </button>
                    </div>
                </div>

                {/* Chiffres clés */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <Stat icon="fa-solid fa-hourglass-half" label="Présence des joueurs" value={heures(releve.heures_presence)} />
                    <Stat icon="fa-solid fa-gamepad" label="Temps de jeu cumulé" value={heures(releve.heures_jeu)} />
                    <Stat icon="fa-solid fa-users" label={`Joueurs (${nombre(releve.joueurs_actifs)} actifs)`} value={nombre(releve.joueurs)} />
                    <Stat icon="fa-solid fa-bed" label={`Lits (${nombre(releve.lits_actifs)} fréquentés)`} value={nombre(releve.lits)} />
                    <Stat icon="fa-solid fa-user-group" label="Villageois" value={nombre(releve.villageois)} />
                    <Stat icon="fa-solid fa-cubes" label={`Chunks (${nombre(releve.chunks_actifs)} visités)`} value={nombre(releve.chunks)} />
                </div>
                {resume.precedent ? (
                    <p className="text-sm opacity-70 px-1 flex flex-row flex-wrap gap-3">
                        <span>Depuis le relevé du {date(resume.precedent.releve_at || resume.precedent.created_at)} :</span>
                        <span>présence <Evolution valeur={evolution.heures_presence} suffixe=" h" /></span>
                        <span>joueurs actifs <Evolution valeur={evolution.joueurs_actifs} /></span>
                        <span>lits <Evolution valeur={evolution.lits} /></span>
                        <span>chunks <Evolution valeur={evolution.chunks} /></span>
                    </p>
                ) : null}

                {/* Villes et quartiers */}
                <section className="flex flex-col gap-2">
                    <TitleH2 text="Villes et quartiers" icon="fa-solid fa-city" />
                    <p className="text-sm opacity-70 px-1">
                        Population mesurée : les lits posés dans les chunks où les joueurs ont passé au moins
                        {` ${nombre(releve.seuil_heures_lit)} h`}, à l'intérieur des frontières du lieu. Sans frontières tracées,
                        la mesure se fait dans un rayon autour du point et reste approximative. Chaque relevé remplace la
                        population des villes et des quartiers du site par cette mesure ; la colonne « Avant » rappelle la
                        valeur qu'ils affichaient auparavant.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra table-sm">
                            <thead>
                                <tr>
                                    <th>Lieu</th>
                                    <th className="text-right">Population</th>
                                    <th className="text-right" title="Population affichée sur le site avant ce relevé">Avant</th>
                                    <th className="text-right">Lits</th>
                                    <th className="text-right">Présence</th>
                                    <th className="text-right">Villageois</th>
                                    <th className="text-right">Résidents</th>
                                    <th className="text-right">Personnages</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lieux.map((lieu) => (
                                    <tr key={`${lieu.entity_type}-${lieu.entity_id}`}>
                                        <td>
                                            <div className="flex flex-row items-center gap-2">
                                                <FontAwesomeIcon
                                                    icon={LIEUX[lieu.entity_type]?.icon || "fa-solid fa-location-dot"}
                                                    title={LIEUX[lieu.entity_type]?.label || lieu.entity_type}
                                                    className="opacity-70"
                                                />
                                                <span className="font-semibold">{lieu.titre_actuel || lieu.title}</span>
                                                {lieu.supprime ? <span className="badge badge-sm badge-ghost">supprimé</span> : null}
                                                {lieu.methode === "rayon" ? (
                                                    <span className="badge badge-sm badge-warning tooltip" data-tip={`Aucune frontière tracée : mesure dans un rayon de ${lieu.rayon} blocs`}>
                                                        rayon
                                                    </span>
                                                ) : null}
                                                {lieu.methode === "villes" ? (
                                                    <span className="badge badge-sm badge-ghost tooltip" data-tip="Somme des mesures de ses villes">villes</span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="text-right font-bold tabular-nums">{nombre(lieu.population)}</td>
                                        <td className="text-right tabular-nums opacity-70">{nombre(lieu.population_declaree)}</td>
                                        <td className="text-right tabular-nums">{nombre(lieu.lits)}</td>
                                        <td className="text-right tabular-nums">{heures(lieu.heures_presence)}</td>
                                        <td className="text-right tabular-nums">{nombre(lieu.villageois)}</td>
                                        <td className="text-right tabular-nums">{nombre(lieu.joueurs_residents)}</td>
                                        <td className="text-right tabular-nums">{nombre(lieu.personnages)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Zones les plus fréquentées */}
                <section className="flex flex-col gap-2">
                    <TitleH2 text="Zones les plus visitées" icon="fa-solid fa-fire" />
                    <p className="text-sm opacity-70 px-1">
                        Carrés de {nombre(releve.taille_tuile)} blocs, classés par temps passé sur place. Une zone très fréquentée
                        loin de toute ville signale un lieu de vie qui n'est pas encore déclaré sur le site.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra table-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Coordonnées</th>
                                    <th className="text-right">Présence</th>
                                    <th className="text-right">Lits</th>
                                    <th className="text-right">Villageois</th>
                                    <th className="text-right">Joueurs</th>
                                    <th>Lieu le plus proche</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zones.map((zone) => {
                                    const lien = lienCarte(zone.dimension_id, zone.x + zone.taille / 2, zone.z + zone.taille / 2);
                                    return (
                                        <tr key={zone.id}>
                                            <td className="opacity-70">{zone.rang}</td>
                                            <td className="font-mono">
                                                {lien ? (
                                                    <a href={lien} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                        {zone.x}, {zone.z}
                                                        <FontAwesomeIcon icon="fa-solid fa-arrow-up-right-from-square" className="ml-1 text-xs" />
                                                    </a>
                                                ) : (
                                                    <span>{zone.x}, {zone.z}</span>
                                                )}
                                            </td>
                                            <td className="text-right tabular-nums font-semibold">{heures(zone.heures_presence)}</td>
                                            <td className="text-right tabular-nums">{nombre(zone.lits)}</td>
                                            <td className="text-right tabular-nums">{nombre(zone.villageois)}</td>
                                            <td className="text-right tabular-nums">{nombre(zone.joueurs)}</td>
                                            <td>
                                                {zone.lieu_title ? (
                                                    <span className="flex flex-row items-center gap-2">
                                                        <span>{zone.lieu_title}</span>
                                                        <span className={`badge badge-sm ${zone.lieu_distance ? "badge-ghost" : "badge-success"}`}>
                                                            {zone.lieu_distance ? `${nombre(zone.lieu_distance)} blocs` : "sur place"}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="opacity-50">aucun</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Joueurs */}
                <section className="flex flex-col gap-2">
                    <TitleH2 text="Joueurs" icon="fa-solid fa-users" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-1">
                        <p className="text-sm opacity-70 flex-1">
                            Actif : au moins {nombre(releve.seuil_heures_actif)} h de jeu et une connexion dans les
                            {` ${nombre(releve.seuil_jours_actif)}`} derniers jours. {nombre(actifs.length)} joueur(s) actif(s)
                            sur {nombre(joueurs.length)}. La sauvegarde ne contient que des UUID : les pseudos viennent des
                            comptes Minecraft liés au site, du serveur, puis de playerdb.co.
                        </p>
                        {sansPseudo.length ? (
                            <button type="button" className="btn btn-sm rounded-2xl gap-2" onClick={chercherPseudos} disabled={pseudosEnCours}>
                                {pseudosEnCours ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-address-card" />}
                                <span>Retrouver {nombre(sansPseudo.length)} pseudo(s)</span>
                            </button>
                        ) : null}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra table-sm">
                            <thead>
                                <tr>
                                    <th>Joueur</th>
                                    <th>Compte du site</th>
                                    <th className="text-right">Temps de jeu</th>
                                    <th>Dernière connexion</th>
                                    <th>Résidence</th>
                                    <th className="text-right">Morts</th>
                                    <th className="text-right">Distance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {joueurs.map((joueur) => (
                                    <tr key={joueur.uuid}>
                                        <td>
                                            <div className="flex flex-row items-center gap-2">
                                                {joueur.avatar_url ? (
                                                    <img src={joueur.avatar_url} alt="" width="24" height="24" className="rounded" loading="lazy" />
                                                ) : null}
                                                <span className={`font-semibold ${joueur.pseudo ? "" : "font-mono text-sm opacity-70"}`} title={joueur.uuid}>
                                                    {joueur.pseudo || joueur.uuid.slice(0, 8)}
                                                </span>
                                                {joueur.is_actif ? <span className="badge badge-sm badge-success">actif</span> : null}
                                            </div>
                                        </td>
                                        <td>
                                            {joueur.utilisateur ? (
                                                <a href={`/profil/${joueur.utilisateur.id}`} className="link link-primary">
                                                    {joueur.utilisateur.full_name || joueur.utilisateur.username}
                                                </a>
                                            ) : (
                                                <span className="opacity-50">non lié</span>
                                            )}
                                        </td>
                                        <td className="text-right tabular-nums font-semibold">{heures(joueur.heures_jeu)}</td>
                                        <td className="whitespace-nowrap">{date(joueur.derniere_activite)}</td>
                                        <td>
                                            {joueur.lieu_title ? (
                                                <span>{joueur.lieu_title}</span>
                                            ) : (
                                                <span className="opacity-50">hors des lieux déclarés</span>
                                            )}
                                        </td>
                                        <td className="text-right tabular-nums">{nombre(joueur.morts)}</td>
                                        <td className="text-right tabular-nums">{nombre(joueur.distance_km)} km</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Dimensions */}
                <section className="flex flex-col gap-2">
                    <TitleH2 text="Dimensions" icon="fa-solid fa-earth-europe" />
                    <div className="overflow-x-auto">
                        <table className="table table-zebra table-sm">
                            <thead>
                                <tr>
                                    <th>Dimension</th>
                                    <th className="text-right">Chunks</th>
                                    <th className="text-right">Visités</th>
                                    <th className="text-right">Présence</th>
                                    <th className="text-right">Lits</th>
                                    <th className="text-right">Villageois</th>
                                    <th className="text-right">Entités</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mesures.map((mesure) => (
                                    <tr key={mesure.id}>
                                        <td className="font-semibold">{mesure.title || "Overworld"}</td>
                                        <td className="text-right tabular-nums">{nombre(mesure.chunks)}</td>
                                        <td className="text-right tabular-nums">{nombre(mesure.chunks_actifs)}</td>
                                        <td className="text-right tabular-nums">{heures(mesure.heures_presence)}</td>
                                        <td className="text-right tabular-nums">{nombre(mesure.lits)}</td>
                                        <td className="text-right tabular-nums">{nombre(mesure.villageois)}</td>
                                        <td className="text-right tabular-nums">{nombre(mesure.entites)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <>
            <Navbar active="admin-monde" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-4 w-full">
                    <TitleH1 text="Statistiques du monde" icon="fas fa-chart-simple" />
                    <p className="text-sm opacity-70 px-1">
                        Relevés dans la sauvegarde du serveur à chaque génération des cartes : temps passé par les joueurs,
                        population des villes, zones les plus vécues et activité de chaque joueur.
                    </p>
                    {content}
                </div>
            </main>
        </>
    );
}
