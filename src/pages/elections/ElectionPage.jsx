import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import InfoLine from "@/components/ui/InfoLine";
import PersonnageAvatar from "@/components/personnages/PersonnageAvatar";

import { usePageTitle } from "@/utils/pageTitle";
import { runAction } from "@/utils/conflits";
import { plural } from "@/utils/plural";
import { dateRp } from "@/config/chroniques";
import { CORPS, ENTITES_ELECTIONS, MODES, RESULTATS, finDuVote, heureScrutin, phaseScrutin } from "@/config/elections";
import { annulerScrutin, candidater, getScrutin, retirerCandidature, voter } from "@/services/api";

// ===== Un scrutin =====
// Candidatures jusqu'à l'ouverture du vote, puis vote de chaque voix du joueur (ses personnages, ou la civilisation /
// la ville qu'il représente), et dépouillement à la clôture (Shard-API crud_elections). Voix et bulletins publics ne
// sont envoyés par l'API qu'une fois le scrutin clos.

function Candidat({ candidat, scrutin, elu, retirable, onRetirer }) {
    const clos = scrutin.phase === "clos";
    return (
        <li aria-label={candidat.nom} className={`flex flex-col gap-2 bg-base-100 rounded-2xl p-3 ${elu ? "ring-2 ring-warning" : ""}`}>
            <div className="flex flex-row items-center gap-3">
                {candidat.personnage ? <PersonnageAvatar personnage={candidat.personnage} /> : null}
                <span className="flex flex-col min-w-0 flex-1">
                    <span className="flex flex-row flex-wrap items-center gap-2">
                        {candidat.personnage
                            ? <a href={`/personnage/${candidat.personnage.id}`} className="font-semibold link link-hover break-words">{candidat.nom}</a>
                            : <span className="font-semibold break-words">{candidat.nom}</span>}
                        {elu ? <span className="badge badge-sm badge-warning"><FontAwesomeIcon icon="fa-solid fa-award" />Élu</span> : null}
                        {candidat.au_second_tour && scrutin.tour === 2 ? <span className="badge badge-sm badge-ghost">Second tour</span> : null}
                    </span>
                    {clos ? (
                        <span className="text-sm tabular-nums">
                            {plural(candidat.voix, "voix", "voix")}
                            {scrutin.deux_tours && candidat.au_second_tour ? ` · second tour : ${plural(candidat.voix_second_tour, "voix", "voix")}` : ""}
                        </span>
                    ) : null}
                </span>
                {retirable ? (
                    <button type="button" className="btn btn-xs btn-ghost bg-base-200 text-error" onClick={onRetirer}>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />Retirer
                    </button>
                ) : null}
            </div>
            {candidat.programme ? <p className="text-sm whitespace-pre-line break-words opacity-90">{candidat.programme}</p> : null}
        </li>
    );
}

function Candidature({ scrutin, onDone }) {
    const [personnageId, setPersonnageId] = useState(String(scrutin.mes_candidats_possibles[0]?.id ?? ""));
    const [programme, setProgramme] = useState("");
    const envoyer = async (event) => {
        event.preventDefault();
        const result = await runAction(() => candidater(scrutin.id, Number(personnageId), programme));
        if (result?.scrutin) onDone(result.scrutin);
    };
    return (
        <form onSubmit={envoyer} aria-label="Se porter candidat" className="flex flex-col gap-3 w-full bg-base-200 rounded-3xl p-4">
            <span className="font-bold flex items-center gap-2"><FontAwesomeIcon icon="fa-solid fa-user-plus" />Se porter candidat</span>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold opacity-70">Personnage</span>
                <select value={personnageId} onChange={(e) => setPersonnageId(e.target.value)} className="select select-ghost bg-base-100 w-full">
                    {scrutin.mes_candidats_possibles.map((personnage) => <option key={personnage.id} value={String(personnage.id)}>{personnage.name}</option>)}
                </select>
            </label>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold opacity-70">Programme</span>
                <textarea value={programme} onChange={(e) => setProgramme(e.target.value)} rows={3} placeholder="Ce que votre personnage promet de faire…" className="textarea textarea-ghost bg-base-100 w-full" />
            </label>
            <button type="submit" className="btn btn-primary w-fit"><FontAwesomeIcon icon="fa-solid fa-user-plus" />Déposer la candidature</button>
        </form>
    );
}

function Voix({ scrutin, voix, candidats, onDone }) {
    const [choix, setChoix] = useState("");
    const qui = voix.type === "personnage" ? voix.title : `${voix.title}, par ${voix.personnage?.name}`;
    if (voix.a_vote) {
        return (
            <li className="flex flex-row items-center gap-2 bg-base-100 rounded-2xl px-3 py-2">
                <FontAwesomeIcon icon="fa-solid fa-circle-check" className="text-success" />
                <span><strong>{qui}</strong> a voté.</span>
            </li>
        );
    }
    const candidat = candidats.find((c) => String(c.id) === choix);
    const envoyer = async () => {
        const result = await runAction(() => voter(scrutin.id, voix.type, voix.id, Number(choix)), {
            confirm: { title: `Voter pour ${candidat?.nom} ?`, text: `${qui} vote pour ${candidat?.nom}. Un vote ne se reprend pas.`, button: "Voter" },
        });
        if (result?.scrutin) onDone(result.scrutin);
    };
    return (
        <li aria-label={`Vote de ${voix.title}`} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-base-100 rounded-2xl p-3">
            <span className="font-semibold flex-1 min-w-0 break-words">{qui}</span>
            <select value={choix} onChange={(e) => setChoix(e.target.value)} aria-label={`Bulletin de ${voix.title}`} className="select select-sm select-ghost bg-base-200 w-full sm:w-56">
                <option value="" disabled>Choisir un candidat</option>
                {candidats.map((c) => <option key={c.id} value={String(c.id)}>{c.nom}</option>)}
            </select>
            <button type="button" disabled={!choix} onClick={envoyer} className="btn btn-sm btn-primary"><FontAwesomeIcon icon="fa-solid fa-check-to-slot" />Voter</button>
        </li>
    );
}

export default function ElectionPage() {
    const { id } = useParams();
    const [scrutin, setScrutin] = useState(null);
    const [loading, setLoading] = useState(true);
    usePageTitle(scrutin?.title);

    const charger = useCallback(() => getScrutin(id)
        .then((data) => setScrutin(data.scrutin))
        .catch(() => setScrutin(null))
        .finally(() => setLoading(false)), [id]);

    useEffect(() => { charger(); }, [charger]);

    const btnReturn = { text: "Retour aux élections", icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: "/elections" };

    let contenu;
    if (loading) {
        contenu = <Skeleton />;
    } else if (!scrutin) {
        contenu = (
            <>
                <TitleH1 text="Scrutin introuvable" icon="fas fa-check-to-slot" btn={btnReturn} />
                <p>Ce scrutin n'existe pas, ou a disparu avec son organisateur.</p>
            </>
        );
    } else {
        const phase = phaseScrutin(scrutin.phase);
        const entite = ENTITES_ELECTIONS[scrutin.entite.type];
        const mode = MODES[scrutin.mode];
        const enVote = scrutin.phase === "vote" || scrutin.phase === "second_tour";
        const candidatsDuTour = scrutin.tour === 2 ? scrutin.candidats.filter((c) => c.au_second_tour) : scrutin.candidats;
        const participation = scrutin.tour === 2 ? scrutin.participation.tour2 : scrutin.participation.tour1;
        const nomCandidat = Object.fromEntries(scrutin.candidats.map((c) => [c.id, c.nom]));
        const FctScrutin = [{
            id: 1, title: "Annuler", icon: "fas fa-ban", class: "bg-base-200 hover:bg-base-300 text-error", connected: true,
            authorisation: scrutin.peut_organiser && !["clos", "annule"].includes(scrutin.phase),
            function: async () => {
                const result = await runAction(() => annulerScrutin(scrutin.id), {
                    confirm: { title: "Annuler ce scrutin ?", text: "Candidatures et votes sont abandonnés ; le scrutin reste visible comme annulé.", button: "Annuler le scrutin" },
                });
                if (result?.scrutin) setScrutin(result.scrutin);
            },
        }];

        contenu = (
            <>
                <TitleH1
                    text={scrutin.title}
                    icon="fas fa-check-to-slot"
                    btn={btnReturn}
                    fonctions={FctScrutin}
                    ariane={[{ label: "Élections", href: "/elections" }, { label: scrutin.title }]}
                />

                <div className="flex flex-col gap-3 w-full bg-base-200 rounded-3xl p-4">
                    <div className="flex flex-row flex-wrap items-center gap-2">
                        <span className={`badge ${phase.badge}`}><FontAwesomeIcon icon={phase.icon} />{phase.label}</span>
                        <span className="badge badge-ghost"><FontAwesomeIcon icon={mode.icon} />Vote {mode.label.toLowerCase()}</span>
                        <span className="badge badge-ghost">{scrutin.deux_tours ? "Deux tours" : "Un tour"}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <InfoLine icon={entite.icon}>
                            {scrutin.entite.lien ? <a href={scrutin.entite.lien} className="link link-hover font-semibold">{scrutin.entite.title}</a> : scrutin.entite.title}
                        </InfoLine>
                        {scrutin.poste ? <InfoLine icon="fa-solid fa-crown">Poste en jeu : <strong>{scrutin.poste.title}</strong></InfoLine> : null}
                        <InfoLine icon="fa-solid fa-users">{CORPS[scrutin.corps]} ({plural(scrutin.votants_count, "voix", "voix")})</InfoLine>
                        <InfoLine icon="fa-solid fa-clock">
                            Vote du {heureScrutin(scrutin.vote_debut)} au {heureScrutin(scrutin.vote_fin)}
                            {scrutin.tour2_fin ? `, second tour jusqu'au ${heureScrutin(scrutin.tour2_fin)}` : ""}
                        </InfoLine>
                        {scrutin.date_rp ? <InfoLine icon="fa-solid fa-hourglass-half">Le {dateRp(scrutin.date_rp)}</InfoLine> : null}
                    </div>
                    <p className="text-sm opacity-80">{mode.texte} Les résultats restent cachés jusqu'à la clôture.</p>
                    {scrutin.description ? <p className="whitespace-pre-line break-words">{scrutin.description}</p> : null}
                    {scrutin.votants_sans_representant.length > 0 && scrutin.phase !== "clos" ? (
                        <p role="note" className="text-sm bg-warning/15 rounded-xl px-3 py-2">
                            Sans représentant dans leur gouvernement, ne peuvent pas voter : {scrutin.votants_sans_representant.join(", ")}.
                        </p>
                    ) : null}
                </div>

                {scrutin.phase === "clos" ? (
                    <section aria-label="Résultat" className="flex flex-col gap-2 w-full bg-base-200 rounded-3xl p-4">
                        <span className="font-bold text-lg flex items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-award" className="text-warning" />
                            {scrutin.elu ? `${scrutin.elu.nom} est élu${scrutin.poste ? ` : ${scrutin.poste.title}` : ""}` : RESULTATS[scrutin.resultat]}
                        </span>
                        <span className="text-sm opacity-80">
                            Participation : {plural(scrutin.participation.tour1, "votant")}
                            {scrutin.tour === 2 ? `, puis ${plural(scrutin.participation.tour2, "votant")} au second tour` : ""} sur {plural(scrutin.votants_count, "voix", "voix")}.
                        </span>
                    </section>
                ) : null}

                {enVote ? (
                    <section aria-label="Voter" className="flex flex-col gap-2 w-full">
                        <TitleH2 text={scrutin.phase === "second_tour" ? "Voter au second tour" : "Voter"} icon="fas fa-check-to-slot" />
                        <p className="text-sm opacity-80 px-1">Jusqu'au {heureScrutin(finDuVote(scrutin))} · {plural(participation, "voix donnée", "voix données")} sur {scrutin.votants_count}.</p>
                        {scrutin.mes_voix.length === 0 ? (
                            <i className="px-1">Aucun de vos personnages ne vote dans ce scrutin.</i>
                        ) : (
                            <ul className="flex flex-col gap-2 w-full">
                                {scrutin.mes_voix.map((voix) => <Voix key={`${voix.type}-${voix.id}`} scrutin={scrutin} voix={voix} candidats={candidatsDuTour} onDone={setScrutin} />)}
                            </ul>
                        )}
                    </section>
                ) : null}

                <TitleH2 text={`Candidats (${scrutin.candidats.length})`} icon="fas fa-user-tie" />
                {scrutin.candidats.length === 0 ? (
                    <i className="w-full">{scrutin.phase === "candidatures" ? `Personne ne s'est encore présenté. Les candidatures sont ouvertes jusqu'au ${heureScrutin(scrutin.vote_debut)}.` : "Aucun candidat."}</i>
                ) : (
                    <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
                        {scrutin.candidats.map((candidat) => (
                            <Candidat
                                key={candidat.id}
                                candidat={candidat}
                                scrutin={scrutin}
                                elu={scrutin.elu?.id === candidat.id}
                                retirable={scrutin.phase === "candidatures" && (scrutin.peut_organiser || candidat.user_id === JSON.parse(localStorage.getItem("user") || "null")?.id)}
                                onRetirer={async () => {
                                    const result = await runAction(() => retirerCandidature(scrutin.id, candidat.id), {
                                        confirm: { title: `Retirer la candidature de ${candidat.nom} ?`, button: "Retirer" },
                                    });
                                    if (result?.scrutin) setScrutin(result.scrutin);
                                }}
                            />
                        ))}
                    </ul>
                )}
                {scrutin.mes_candidats_possibles.length > 0 ? <Candidature scrutin={scrutin} onDone={setScrutin} /> : null}

                {scrutin.bulletins.length > 0 ? (
                    <>
                        <TitleH2 text="Bulletins" icon="fas fa-hand" />
                        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 w-full">
                            {scrutin.bulletins.map((bulletin) => (
                                <li key={`${bulletin.tour}-${bulletin.votant_type}-${bulletin.votant_id}`} className="flex flex-row flex-wrap items-center gap-2 bg-base-200 rounded-xl px-3 py-2 text-sm">
                                    <strong className="break-words">{bulletin.votant_title}</strong>
                                    <FontAwesomeIcon icon="fa-solid fa-arrow-right" className="opacity-60" />
                                    <span className="break-words">{nomCandidat[bulletin.candidat_id]}</span>
                                    {scrutin.tour === 2 ? <span className="badge badge-xs badge-ghost">{bulletin.tour === 2 ? "2d tour" : "1er tour"}</span> : null}
                                </li>
                            ))}
                        </ul>
                    </>
                ) : null}
            </>
        );
    }

    return (
        <>
            <Navbar active="elections" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">{contenu}</div>
            </main>
        </>
    );
}
