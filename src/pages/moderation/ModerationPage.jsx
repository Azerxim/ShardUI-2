import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import FormModal from "@/components/modals/FormModal";
import { usePageTitle } from "@/utils/pageTitle";
import { showModalID } from "@/utils/showModal";
import { plural } from "@/utils/plural";
import { formatDate } from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import { apiRequest, deciderAjustement, deciderFerme, deciderPiege, getTableauModeration, photoFermeUrl } from "@/services/api";

// ===== Tableau de bord des modérateurs RP =====
// Tout ce qui attend une décision (déclarations de guerre, ajustements de population, fermes, pièges révélés), ce qui
// reste à suivre, et l'historique des décisions et lectures tracées (Shard-API crud_moderation). Chaque décision passe
// par la route de son domaine ; une demande ou un piège dont le modérateur est l'auteur revient à un autre modérateur.

const MODAL_ID = "moderation-decision-modal";
const HISTORIQUE_PAGE = 40;

const CATEGORIES = {
    guerres: { label: "Guerres", icon: "fa-solid fa-shield-halved" },
    population: { label: "Population", icon: "fa-solid fa-scale-balanced" },
    fermes: { label: "Fermes", icon: "fa-solid fa-wheat-awn" },
    actions: { label: "Actions secrètes", icon: "fa-solid fa-user-secret" },
    chroniques: { label: "Chroniques", icon: "fa-solid fa-timeline" },
};

const formatDateHeure = (date) => (date ? new Date(date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "");
const nom = (user) => user?.full_name || user?.username || "Compte supprimé";
const leader = (camp) => (camp || []).find((b) => b.is_leader)?.entite?.title ?? "?";

function AccessMessage({ text, link, label }) {
    return (
        <>
            <Navbar active="moderation" />
            <div className="text-center py-12 px-4">
                <p className="text-xl">{text}</p>
                <Link to={link} className="btn btn-primary mt-4">{label}</Link>
            </div>
        </>
    );
}

// Carte d'un élément à traiter : titre, détails, puis boutons de décision
function Carte({ icon, titre, lien, sousTitre, propre, children, actions }) {
    return (
        <li className="flex flex-col gap-2 bg-base-200 rounded-2xl p-4">
            <div className="flex flex-row flex-wrap items-center gap-2">
                <FontAwesomeIcon icon={icon} className="opacity-70" />
                {lien ? <a href={lien} className="font-bold link link-hover break-words flex-1 min-w-0">{titre}</a> : <span className="font-bold break-words flex-1 min-w-0">{titre}</span>}
                {propre ? <span className="badge badge-sm badge-ghost">Votre demande : un autre modérateur tranche</span> : null}
            </div>
            {sousTitre ? <span className="text-sm opacity-70">{sousTitre}</span> : null}
            {children}
            {actions && !propre ? <div className="flex flex-row flex-wrap gap-2 mt-1">{actions}</div> : null}
        </li>
    );
}

function Groupe({ id, titre, icon, elements, vide, children }) {
    return (
        <div id={id} className="flex flex-col gap-2 scroll-mt-28">
            <h3 className="flex flex-row items-center gap-2 font-bold text-lg">
                <FontAwesomeIcon icon={icon} />
                {titre}
                <span className={`badge badge-sm ${elements.length ? "badge-warning" : "badge-ghost"}`}>{elements.length}</span>
            </h3>
            {elements.length === 0 ? <i className="text-sm opacity-70">{vide}</i> : <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">{children}</ul>}
        </div>
    );
}

export default function ModerationPage() {
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [erreur, setErreur] = useState(null);
    // L'API décide : le rôle gardé dans le navigateur peut dater d'avant une nomination ou un retrait
    const [refuse, setRefuse] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [decision, setDecision] = useState(null);
    const [categorie, setCategorie] = useState("");
    const [visibles, setVisibles] = useState(HISTORIQUE_PAGE);

    usePageTitle("Modération RP");

    useEffect(() => {
        if (!user) return;
        let annule = false;
        getTableauModeration()
            .then((result) => { if (!annule) { setData(result); setErreur(null); } })
            .catch((error) => {
                if (annule) return;
                if (error.status === 403) setRefuse(true);
                else setErreur(error.message);
            });
        return () => { annule = true; };
    }, [user?.id, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (decision) showModalID(MODAL_ID);
    }, [decision]);

    if (!user) return <AccessMessage text="Vous devez être connecté pour accéder à cette page." link="/login" label="Se connecter" />;
    if (refuse) return <AccessMessage text="Le tableau de bord est réservé aux modérateurs RP et aux administrateurs." link="/" label="Retour à l'accueil" />;

    // Une décision : la modale demande ses champs, puis appelle la route du domaine
    const decider = (titre, fields, envoyer, options = {}) => setDecision((prev) => ({ titre, fields, envoyer, ...options, n: (prev?.n ?? 0) + 1 }));
    const soumettre = async (values) => {
        const result = await decision.envoyer(values);
        Swal.fire({ icon: "success", title: "Décision enregistrée", text: result?.text ?? "C'est fait." });
        setReloadKey((key) => key + 1);
    };
    const note = (requise, placeholder) => ({ name: "note", label: requise ? "Motif" : "Note", type: "textarea", required: requise, placeholder });

    const aTraiter = data?.a_traiter ?? { guerres: [], ajustements: [], fermes: [], pieges: [] };
    const suivi = data?.suivi ?? { guerres: [], fermes: [], actions_scellees: [] };
    const historique = (data?.historique ?? []).filter((entree) => !categorie || entree.categorie === categorie);
    const decisionsPossibles = (liste) => liste.filter((item) => !item.propre).length;
    const total = aTraiter.guerres.length + decisionsPossibles(aTraiter.ajustements) + aTraiter.fermes.length + decisionsPossibles(aTraiter.pieges);

    const compteurs = [
        { id: "guerres", label: "Guerres", icon: "fa-solid fa-shield-halved", n: aTraiter.guerres.length },
        { id: "population", label: "Population", icon: "fa-solid fa-scale-balanced", n: aTraiter.ajustements.length },
        { id: "fermes", label: "Fermes", icon: "fa-solid fa-wheat-awn", n: aTraiter.fermes.length },
        { id: "pieges", label: "Pièges", icon: "fa-solid fa-skull", n: aTraiter.pieges.length },
    ];

    return (
        <>
            <Navbar active="moderation" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center gap-2">
                    <TitleH1 text="Tableau de bord de la modération" icon="fas fa-gavel" ariane={[{ label: "Modération RP" }]} />

                    {erreur ? <div role="alert" className="alert alert-error w-full">Impossible de charger le tableau de bord : {erreur}</div> : null}
                    {!data && !erreur ? <Skeleton /> : null}

                    {data ? (
                        <>
                            <nav aria-label="Rubriques du tableau de bord" className="sticky top-24 z-20 w-full flex flex-wrap items-center gap-2 py-2 px-3 rounded-3xl bg-base-100/95 backdrop-blur shadow-md">
                                <span className={`badge ${total ? "badge-warning" : "badge-success"} font-semibold`}>
                                    {total ? `${plural(total, "décision")} à prendre` : "Tout est à jour"}
                                </span>
                                {compteurs.map((c) => (
                                    <a key={c.id} href={`#${c.id}`} className="btn btn-sm rounded-full bg-base-200">
                                        <FontAwesomeIcon icon={c.icon} />
                                        {c.label}
                                        <span className={`badge badge-sm ${c.n ? "badge-warning" : ""}`}>{c.n}</span>
                                    </a>
                                ))}
                                <a href="#suivi" className="btn btn-sm rounded-full btn-ghost">Suivi</a>
                                <a href="#historique" className="btn btn-sm rounded-full btn-ghost">Historique</a>
                            </nav>

                            <section id="a-traiter" aria-label="À traiter" className="flex flex-col gap-6 w-full mt-2">
                                <TitleH2 text="À traiter" icon="fas fa-inbox" aide="moderateur" />

                                <Groupe id="guerres" titre="Déclarations de guerre" icon="fa-solid fa-shield-halved" elements={aTraiter.guerres} vide="Aucune déclaration n'attend de validation.">
                                    {aTraiter.guerres.map(({ guerre, camps, declarant }) => (
                                        <Carte
                                            key={guerre.id}
                                            icon="fa-solid fa-shield-halved"
                                            titre={guerre.title}
                                            lien={`/guerre/${guerre.id}`}
                                            sousTitre={`${leader(camps.attaquant)} contre ${leader(camps.defenseur)} · déclarée le ${formatDate(guerre.declared_at)}${declarant ? ` par ${nom(declarant)}` : ""}`}
                                            actions={(
                                                <>
                                                    <button type="button" className="btn btn-sm btn-success" onClick={() => decider(`Valider « ${guerre.title} »`, [
                                                        { name: "date_debut", label: "Début dans le RP", type: "date", help: "Aujourd'hui si laissé vide." },
                                                        note(false, "Cadre, enjeux, règles particulières…"),
                                                    ], (values) => apiRequest("PUT", `/guerres/${guerre.id}/valider`, values), { submitLabel: "Valider", submitClass: "btn-success" })}>Valider</button>
                                                    <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => decider(`Refuser « ${guerre.title} »`, [
                                                        note(true, "Expliquez aux camps ce qu'il faut préparer."),
                                                    ], (values) => apiRequest("PUT", `/guerres/${guerre.id}/refuser`, values), { submitLabel: "Refuser", submitClass: "btn-error" })}>Refuser</button>
                                                </>
                                            )}
                                        >
                                            {guerre.casus_belli ? <p className="text-sm whitespace-pre-line line-clamp-4"><strong>Casus belli :</strong> {guerre.casus_belli}</p> : null}
                                        </Carte>
                                    ))}
                                </Groupe>

                                <Groupe id="population" titre="Ajustements de population" icon="fa-solid fa-scale-balanced" elements={aTraiter.ajustements} vide="Aucun ajustement n'attend de décision.">
                                    {aTraiter.ajustements.map((a) => (
                                        <Carte
                                            key={a.id}
                                            icon="fa-solid fa-city"
                                            titre={`${a.ville.title} : ${a.ecart > 0 ? "+" : "−"}${Math.abs(a.ecart)} habitants`}
                                            lien={`/civilisation/${a.ville.civilisation_id}/ville/${a.ville.id}#population`}
                                            sousTitre={`Demandé le ${formatDate(a.demande_at)} par ${nom(a.demande_par)} · population mesurée : ${a.ville.mesuree}`}
                                            propre={a.propre}
                                            actions={(
                                                <>
                                                    <button type="button" className="btn btn-sm btn-success" onClick={() => decider(`Accepter l'ajustement de ${a.ville.title}`, [note(false, "Facultatif")],
                                                        (values) => deciderAjustement(a.id, true, values.note), { submitLabel: "Accepter", submitClass: "btn-success" })}>Accepter</button>
                                                    <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => decider(`Refuser l'ajustement de ${a.ville.title}`, [note(false, "Pourquoi l'écart n'est pas retenu")],
                                                        (values) => deciderAjustement(a.id, false, values.note), { submitLabel: "Refuser", submitClass: "btn-error" })}>Refuser</button>
                                                </>
                                            )}
                                        >
                                            <p className="text-sm"><strong>Motif :</strong> {a.motif}</p>
                                        </Carte>
                                    ))}
                                </Groupe>

                                <Groupe id="fermes" titre="Fermes déclarées" icon="fa-solid fa-wheat-awn" elements={aTraiter.fermes} vide="Aucune ferme n'attend de validation.">
                                    {aTraiter.fermes.map((ferme) => (
                                        <Carte
                                            key={ferme.id}
                                            icon="fa-solid fa-wheat-awn"
                                            titre={ferme.title}
                                            lien={`/fermes#ferme-${ferme.id}`}
                                            sousTitre={`Déclarée le ${formatDate(ferme.created_at)} par ${nom(ferme.declarant)}${ferme.ville ? ` · ${ferme.ville.title}` : ""}${ferme.x != null ? ` · X ${ferme.x}, Z ${ferme.z}` : ""}`}
                                            actions={(
                                                <>
                                                    <button type="button" className="btn btn-sm btn-success" onClick={() => decider(`Valider « ${ferme.title} »`, [note(false, "Facultatif")],
                                                        (values) => deciderFerme(ferme.id, "validee", values.note), { submitLabel: "Valider", submitClass: "btn-success" })}>Valider</button>
                                                    <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => decider(`Mise en conformité de « ${ferme.title} »`, [note(true, "Ce qui doit changer : habillage, justification, production…")],
                                                        (values) => deciderFerme(ferme.id, "a_corriger", values.note), { submitLabel: "Demander", submitClass: "btn-warning" })}>À mettre en conformité</button>
                                                </>
                                            )}
                                        >
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {ferme.photo ? (
                                                    <a href={photoFermeUrl(ferme.photo)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                        <img src={photoFermeUrl(ferme.photo)} alt={`Photo de ${ferme.title}`} className="w-full sm:w-36 h-28 object-cover rounded-xl" loading="lazy" onError={(e) => { e.currentTarget.closest("a").hidden = true; }} />
                                                    </a>
                                                ) : null}
                                                <div className="flex flex-col gap-1 text-sm">
                                                    {ferme.production ? <span><strong>Production :</strong> {ferme.production}</span> : null}
                                                    <span className="line-clamp-4"><strong>Justification :</strong> {ferme.justification}</span>
                                                    {ferme.habillage ? <span><strong>Habillage :</strong> {ferme.habillage}</span> : null}
                                                </div>
                                            </div>
                                        </Carte>
                                    ))}
                                </Groupe>

                                <Groupe id="pieges" titre="Pièges révélés à juger" icon="fa-solid fa-skull" elements={aTraiter.pieges} vide="Aucun piège n'attend de jugement.">
                                    {aTraiter.pieges.map((piege) => (
                                        <Carte
                                            key={piege.id}
                                            icon="fa-solid fa-skull"
                                            titre={`${piege.code} · ${piege.title}`}
                                            lien={`/actions-secretes#${piege.code}`}
                                            sousTitre={`${piege.entite?.title ?? "?"} · scellé le ${formatDateHeure(piege.created_at)}, révélé le ${formatDateHeure(piege.revealed_at)}`}
                                            propre={piege.propre}
                                            actions={(
                                                <>
                                                    <button type="button" className="btn btn-sm btn-error" onClick={() => decider(`Piège ${piege.code} : mortel`, [note(false, "Facultatif")],
                                                        (values) => deciderPiege(piege.id, true, values.note), { submitLabel: "Le piège tue", submitClass: "btn-error" })}>Mortel</button>
                                                    <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => decider(`Piège ${piege.code} : blessure`, [note(true, "Pourquoi le piège ne tue pas (non conforme à l'action scellée, victime absente…)")],
                                                        (values) => deciderPiege(piege.id, false, values.note), { submitLabel: "Le piège blesse", submitClass: "btn-warning" })}>Simple blessure</button>
                                                </>
                                            )}
                                        >
                                            <p className="text-sm whitespace-pre-line line-clamp-6 bg-base-100 rounded-xl p-3">{piege.content}</p>
                                        </Carte>
                                    ))}
                                </Groupe>
                            </section>

                            <section id="suivi" aria-label="Suivi" className="flex flex-col gap-6 w-full mt-6 scroll-mt-28">
                                <TitleH2 text="Suivi" icon="fas fa-binoculars" />
                                <Groupe id="suivi-guerres" titre="Guerres en cours" icon="fa-solid fa-fire" elements={suivi.guerres} vide="Aucune guerre en cours.">
                                    {suivi.guerres.map(({ guerre, camps }) => (
                                        <Carte key={guerre.id} icon="fa-solid fa-fire" titre={guerre.title} lien={`/guerre/${guerre.id}`}
                                            sousTitre={`${leader(camps.attaquant)} contre ${leader(camps.defenseur)} · en cours depuis le ${formatDate(guerre.date_debut || guerre.validated_at)} · à clore sur sa fiche une fois l'issue jouée`} />
                                    ))}
                                </Groupe>
                                <Groupe id="suivi-fermes" titre="Fermes à mettre en conformité" icon="fa-solid fa-wrench" elements={suivi.fermes} vide="Aucune ferme en attente de correction.">
                                    {suivi.fermes.map((ferme) => (
                                        <Carte key={ferme.id} icon="fa-solid fa-wheat-awn" titre={ferme.title} lien={`/fermes#ferme-${ferme.id}`}
                                            sousTitre={`${nom(ferme.declarant)} · demandé le ${formatDate(ferme.decision_at)} par ${nom(ferme.moderateur)}`}>
                                            {ferme.decision_note ? <p className="text-sm"><strong>Demande :</strong> {ferme.decision_note}</p> : null}
                                        </Carte>
                                    ))}
                                </Groupe>
                                <Groupe id="suivi-actions" titre="Actions secrètes scellées" icon="fa-solid fa-lock" elements={suivi.actions_scellees} vide="Aucune action scellée.">
                                    {suivi.actions_scellees.map((action) => (
                                        <Carte key={action.id} icon="fa-solid fa-lock" titre={action.code} lien={`/actions-secretes#${action.code}`}
                                            sousTitre={`Scellée le ${formatDateHeure(action.created_at)}${action.reveal_at ? ` · révélation automatique le ${formatDateHeure(action.reveal_at)}` : ""} · toute lecture est tracée`} />
                                    ))}
                                </Groupe>
                            </section>

                            <section id="historique" aria-label="Historique" className="flex flex-col gap-3 w-full mt-6 scroll-mt-28">
                                <TitleH2 text="Historique" icon="fas fa-clock-rotate-left" />
                                <div role="group" aria-label="Filtrer l'historique" className="flex flex-wrap gap-2">
                                    {[["", { label: "Tout", icon: "fa-solid fa-list" }], ...Object.entries(CATEGORIES)].map(([cle, c]) => (
                                        <button key={cle || "tout"} type="button" aria-pressed={categorie === cle} onClick={() => { setCategorie(cle); setVisibles(HISTORIQUE_PAGE); }}
                                            className={`btn btn-sm rounded-full ${categorie === cle ? "btn-primary" : "bg-base-200"}`}>
                                            <FontAwesomeIcon icon={c.icon} />{c.label}
                                        </button>
                                    ))}
                                </div>
                                {historique.length === 0 ? <i className="opacity-70">Aucune décision dans cette rubrique.</i> : (
                                    <ol aria-label="Décisions" className="flex flex-col gap-2 border-l-2 border-base-300 ml-3 pl-4">
                                        {historique.slice(0, visibles).map((entree, index) => {
                                            const c = CATEGORIES[entree.categorie] ?? CATEGORIES.guerres;
                                            return (
                                                <li key={index} className="relative flex flex-col gap-1 bg-base-200 rounded-2xl p-3">
                                                    <span className="absolute -left-7 top-3 flex items-center justify-center w-6 h-6 rounded-full bg-base-100 border-2 border-base-300 text-xs" aria-hidden="true">
                                                        <FontAwesomeIcon icon={c.icon} />
                                                    </span>
                                                    <div className="flex flex-row flex-wrap items-center gap-2">
                                                        <span className="font-semibold">{entree.decision}</span>
                                                        <span>·</span>
                                                        {entree.lien ? <a href={entree.lien} className="link link-hover break-words">{entree.titre}</a> : <span className="break-words">{entree.titre}</span>}
                                                        <span className="badge badge-sm badge-ghost">{c.label}</span>
                                                    </div>
                                                    <span className="text-xs opacity-70">{formatDateHeure(entree.date)} · {entree.moderateur ? nom(entree.moderateur) : "automatique"}</span>
                                                    {entree.note ? <p className="text-sm whitespace-pre-line opacity-90">{entree.note}</p> : null}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                                {historique.length > visibles ? (
                                    <button type="button" className="btn btn-sm btn-ghost bg-base-200 self-center" onClick={() => setVisibles((v) => v + HISTORIQUE_PAGE)}>
                                        Voir plus ({historique.length - visibles} restantes)
                                    </button>
                                ) : null}
                            </section>
                        </>
                    ) : null}

                    {decision ? (
                        <FormModal
                            key={`decision-${decision.n}`}
                            id={MODAL_ID}
                            title={decision.titre}
                            fields={decision.fields}
                            submitLabel={decision.submitLabel ?? "Enregistrer"}
                            submitIcon="fas fa-gavel"
                            submitClass={decision.submitClass ?? "btn-primary"}
                            onSubmit={soumettre}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
