import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Outil from '@/components/aides/Outil';
import { minecraftHead } from '@/utils/personnages';
import { DISCORD_INVITE, marquerDiscordOuvert } from '@/utils/parcours';
import { ORIGINES_CANDIDATURE, PROJETS_CANDIDATURE, QUESTIONS_CANDIDATURE, REGLES_CANDIDATURE } from '@/config/aides';

// ===== Aide à la candidature =====
// Les questions du formulaire « Postuler pour rejoindre » du Discord (config/aides.js : QUESTIONS_CANDIDATURE), avec
// les conseils de l'équipe. Le joueur prépare ses réponses ici puis les copie une à une dans le formulaire.
// Le brouillon reste dans ce navigateur (localStorage) ; seul le pseudo part vers playerdb.co, à la demande, pour
// vérifier que le compte Minecraft Java existe.

const CLE_BROUILLON = 'aides.candidature';
const VIDE = { pseudo: '', age: '', experience: '', projets: [], projet: '', personnage: '', origine: '' };
const PSEUDO = /^\w{3,16}$/;

function lireBrouillon() {
    try {
        const brouillon = JSON.parse(localStorage.getItem(CLE_BROUILLON));
        if (!brouillon || typeof brouillon !== 'object') return VIDE;
        // Ancien brouillon : l'âge était saisi en clair, la question est désormais « plus de 15 ans ? »
        return { ...VIDE, ...brouillon, age: ['oui', 'non'].includes(brouillon.age) ? brouillon.age : '' };
    } catch {
        return VIDE;
    }
}

function ecrireBrouillon(reponses) {
    try {
        if (JSON.stringify(reponses) === JSON.stringify(VIDE)) {
            localStorage.removeItem(CLE_BROUILLON);
        } else {
            localStorage.setItem(CLE_BROUILLON, JSON.stringify(reponses));
        }
    } catch {
        // Stockage indisponible (navigation privée) : le brouillon vaut pour cette visite
    }
}

// Texte d'une partie de la question en trois parties ; une trame laissée telle quelle n'est pas une réponse
function partieTexte(partie, reponses) {
    if (partie.choix) {
        const choix = reponses.projets.join(', ');
        const precision = reponses.projet.trim();
        return [choix, precision].filter(Boolean).join(choix && precision ? ' : ' : '');
    }
    const texte = (reponses[partie.id] || '').trim();
    return partie.modele && texte === partie.modele.trim() ? '' : texte;
}

// Texte à coller dans le formulaire pour une question
function reponseTexte(question, reponses) {
    if (question.type === 'ouinon') return { oui: 'Oui', non: 'Non' }[reponses[question.id]] || '';
    if (question.type === 'parcours') {
        return question.parties
            .map((partie) => [partie, partieTexte(partie, reponses)])
            .filter(([, texte]) => texte)
            .map(([partie, texte]) => `${partie.intitule} : ${texte.includes('\n') ? `\n${texte}` : texte}`)
            .join('\n\n');
    }
    return (reponses[question.id] || '').trim();
}

// Réponse complète : pour la question en trois parties, les parties essentielles (expérience et projet) sont remplies
const reponseComplete = (question, reponses) => (question.type === 'parcours'
    ? question.parties.filter((partie) => partie.essentiel).every((partie) => partieTexte(partie, reponses))
    : Boolean(reponseTexte(question, reponses)));

// Pseudo vérifié sur playerdb.co (compte Minecraft Java) : renvoie le pseudo exact et l'UUID, ou null s'il n'existe pas
async function verifierPseudo(pseudo) {
    const reponse = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(pseudo)}`);
    if (reponse.status === 400 || reponse.status === 404) return null;
    if (!reponse.ok) throw new Error(`playerdb.co : ${reponse.status}`);
    const corps = await reponse.json();
    const joueur = corps?.data?.player;
    return joueur ? { pseudo: joueur.username, uuid: joueur.id } : null;
}

function BoutonCopier({ texte, label = 'Copier', className = 'btn btn-sm btn-outline' }) {
    const [etat, setEtat] = useState(null); // null | copie | echec

    const copier = async () => {
        try {
            await navigator.clipboard.writeText(texte);
            setEtat('copie');
        } catch {
            setEtat('echec');
        }
        setTimeout(() => setEtat(null), 2500);
    };

    return (
        <button type="button" className={className} onClick={copier} disabled={!texte} aria-live="polite">
            <FontAwesomeIcon icon={etat === 'copie' ? 'fa-solid fa-check' : 'fa-solid fa-copy'} />
            {etat === 'copie' ? 'Copié' : etat === 'echec' ? 'Copie refusée : sélectionnez le texte' : label}
        </button>
    );
}

// Longueur de la réponse : discrète, en orange tant qu'elle reste sous la longueur conseillée
function Compteur({ texte, conseille }) {
    const longueur = texte.length;
    const court = conseille && longueur > 0 && longueur < conseille;
    return (
        <span className={`text-xs tabular-nums ${court ? 'text-warning' : 'opacity-60'}`}>
            {longueur} caractère{longueur > 1 ? 's' : ''}
            {conseille ? (court ? ` · un peu court, visez au moins ${conseille}` : longueur ? '' : ` · ${conseille} conseillés`) : ''}
        </span>
    );
}

export default function AideCandidature() {
    const [reponses, setReponses] = useState(lireBrouillon);
    // Vérification du pseudo, valable pour la valeur vérifiée seulement : modifier le pseudo l'efface
    const [verification, setVerification] = useState(null); // { pour, etat: verification | trouve | introuvable | erreur, compte }

    useEffect(() => ecrireBrouillon(reponses), [reponses]);

    const changer = (cle, valeur) => setReponses((actuelles) => ({ ...actuelles, [cle]: valeur }));
    const basculerProjet = (projet) => setReponses((actuelles) => ({
        ...actuelles,
        projets: actuelles.projets.includes(projet) ? actuelles.projets.filter((item) => item !== projet) : [...actuelles.projets, projet],
    }));

    const pseudo = reponses.pseudo.trim();
    const verif = verification?.pour === pseudo ? verification : null;

    const verifier = async () => {
        setVerification({ pour: pseudo, etat: 'verification' });
        try {
            const compte = await verifierPseudo(pseudo);
            setVerification({ pour: pseudo, etat: compte ? 'trouve' : 'introuvable', compte });
        } catch {
            setVerification({ pour: pseudo, etat: 'erreur' });
        }
    };

    const textes = Object.fromEntries(QUESTIONS_CANDIDATURE.map((question) => [question.id, reponseTexte(question, reponses)]));
    const completes = Object.fromEntries(QUESTIONS_CANDIDATURE.map((question) => [question.id, reponseComplete(question, reponses)]));
    const pretes = QUESTIONS_CANDIDATURE.filter((question) => completes[question.id]).length;
    const commencees = QUESTIONS_CANDIDATURE.filter((question) => textes[question.id]).length;
    const toutes = QUESTIONS_CANDIDATURE.map((question, index) => `${index + 1}. ${question.question}\n${textes[question.id] || '(sans réponse)'}`).join('\n\n');

    const effacer = () => {
        if (!window.confirm('Effacer toutes vos réponses ?')) return;
        setReponses(VIDE);
        setVerification(null);
    };

    const champ = (question) => {
        const commun = {
            id: `candidature-${question.id}`,
            placeholder: question.placeholder,
            className: 'bg-base-100 w-full',
        };
        switch (question.type) {
            case 'pseudo':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="join w-full">
                            <input
                                {...commun}
                                type="text"
                                value={reponses.pseudo}
                                onChange={(e) => changer('pseudo', e.target.value)}
                                placeholder="Votre pseudo exact"
                                autoComplete="off"
                                spellCheck={false}
                                maxLength={16}
                                className={`${commun.className} input input-ghost join-item flex-1 min-w-0 font-mono`}
                            />
                            <button type="button" className="btn join-item" onClick={verifier} disabled={!PSEUDO.test(pseudo) || verif?.etat === 'verification'}>
                                {verif?.etat === 'verification' ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />}
                                Vérifier
                            </button>
                        </div>
                        {pseudo && !PSEUDO.test(pseudo) ? (
                            <p className="text-sm text-warning">Un pseudo Minecraft compte 3 à 16 caractères : lettres sans accent, chiffres et _.</p>
                        ) : null}
                        {verif?.etat === 'trouve' ? (
                            <div className="flex items-center gap-3 text-sm">
                                <img src={minecraftHead(verif.compte.uuid, 32)} alt="" className="w-8 h-8 rounded" style={{ imageRendering: 'pixelated' }} />
                                <span>
                                    <FontAwesomeIcon icon="fa-solid fa-circle-check" className="text-success mr-1" />
                                    Compte Java trouvé : <b className="font-mono">{verif.compte.pseudo}</b>
                                </span>
                                {verif.compte.pseudo !== pseudo ? (
                                    <button type="button" className="btn btn-xs btn-ghost" onClick={() => changer('pseudo', verif.compte.pseudo)}>Reprendre cette écriture</button>
                                ) : null}
                            </div>
                        ) : null}
                        {verif?.etat === 'introuvable' ? (
                            <p className="text-sm text-error"><FontAwesomeIcon icon="fa-solid fa-circle-xmark" className="mr-1" />Aucun compte Minecraft Java à ce nom : vérifiez l'orthographe. Le formulaire demande le pseudo de l'édition Java.</p>
                        ) : null}
                        {verif?.etat === 'erreur' ? (
                            <p className="text-sm opacity-70">Vérification indisponible pour le moment : relisez simplement votre pseudo.</p>
                        ) : null}
                    </div>
                );
            case 'ouinon':
                return (
                    <div className="join" role="radiogroup" aria-labelledby={`candidature-${question.id}-titre`}>
                        {[['oui', 'Oui'], ['non', 'Non']].map(([valeur, label]) => (
                            <button
                                key={valeur}
                                type="button"
                                role="radio"
                                aria-checked={reponses[question.id] === valeur}
                                onClick={() => changer(question.id, valeur)}
                                className={`btn btn-sm join-item w-20 ${reponses[question.id] === valeur ? 'btn-primary' : 'bg-base-200'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                );
            case 'origine':
                return (
                    <>
                        <input {...commun} type="text" list="candidature-origines" value={reponses.origine} onChange={(e) => changer('origine', e.target.value)} className={`${commun.className} input input-ghost`} />
                        <datalist id="candidature-origines">
                            {ORIGINES_CANDIDATURE.map((origine) => <option key={origine} value={origine} />)}
                        </datalist>
                    </>
                );
            case 'parcours':
                return (
                    <div className="flex flex-col gap-3">
                        {question.parties.map((partie) => (
                            <div key={partie.id} className={`flex flex-col gap-2 rounded-xl p-3 ${partie.essentiel ? 'bg-base-200 border-l-4 border-primary' : 'bg-base-200/50'}`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor={`candidature-${partie.id}`} className={partie.essentiel ? 'font-semibold' : 'font-semibold text-sm opacity-80'}>{partie.titre}</label>
                                    <span className={`badge badge-sm ${partie.essentiel ? 'badge-primary' : 'badge-ghost'}`}>{partie.essentiel ? 'Essentiel' : 'Facultatif'}</span>
                                    {partieTexte(partie, reponses) ? <FontAwesomeIcon icon="fa-solid fa-check" className="text-success" aria-label="Remplie" /> : null}
                                </div>
                                <p className="text-xs opacity-70">{partie.aide}</p>
                                {partie.choix ? (
                                    <div className="flex flex-wrap gap-2" role="group" aria-label="Ce qui vous tente">
                                        {PROJETS_CANDIDATURE.map((projet) => {
                                            const coche = reponses.projets.includes(projet);
                                            return (
                                                <button key={projet} type="button" aria-pressed={coche} onClick={() => basculerProjet(projet)} className={`btn btn-sm rounded-full ${coche ? 'btn-primary' : 'btn-ghost bg-base-100'}`}>
                                                    {coche ? <FontAwesomeIcon icon="fa-solid fa-check" /> : null}
                                                    {projet}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : null}
                                <textarea
                                    id={`candidature-${partie.id}`}
                                    rows={partie.essentiel ? 3 : 2}
                                    value={partie.choix ? reponses.projet : reponses[partie.id]}
                                    onChange={(e) => changer(partie.choix ? 'projet' : partie.id, e.target.value)}
                                    placeholder={partie.placeholder}
                                    aria-label={partie.choix ? 'Précisez votre projet' : undefined}
                                    className="textarea textarea-ghost bg-base-100 w-full"
                                />
                                {partie.modele && !reponses[partie.id].trim() ? (
                                    <button type="button" className="btn btn-xs btn-ghost self-start" onClick={() => changer(partie.id, partie.modele)}>
                                        <FontAwesomeIcon icon="fa-solid fa-lightbulb" />
                                        Partir d'une trame
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                );
            default:
                return <input {...commun} type="text" value={reponses[question.id]} onChange={(e) => changer(question.id, e.target.value)} className={`${commun.className} input input-ghost`} />;
        }
    };

    return (
        <Outil
            id="candidature"
            icon="fa-solid fa-file-signature"
            titre="Aide à la candidature"
            texte="Le serveur est sous whitelist : on y entre sur candidature, déposée sur le Discord avec « Postuler pour rejoindre ». Préparez vos réponses ici, à tête reposée, puis copiez-les une à une dans le formulaire."
        >
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {[
                    { icon: 'fa-solid fa-pen', texte: 'Répondez aux questions ci-dessous : votre brouillon reste dans ce navigateur.' },
                    { icon: 'fa-brands fa-discord', texte: 'Ouvrez le Discord et cliquez sur « Postuler pour rejoindre ».' },
                    { icon: 'fa-solid fa-copy', texte: 'Copiez chaque réponse dans le champ du même nom, acceptez les règles, envoyez.' },
                ].map((etape, index) => (
                    <li key={etape.texte} className="flex gap-3 bg-base-100 rounded-2xl p-3">
                        <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-secondary text-secondary-content font-semibold text-xs">{index + 1}</span>
                        <span className="opacity-90"><FontAwesomeIcon icon={etape.icon} className="mr-1 opacity-70" />{etape.texte}</span>
                    </li>
                ))}
            </ol>

            <details className="collapse collapse-arrow bg-base-100 rounded-2xl">
                <summary className="collapse-title font-semibold text-sm">Les règles à accepter dans le formulaire</summary>
                <div className="collapse-content text-sm flex flex-col gap-2">
                    <ol className="list-decimal pl-5 flex flex-col gap-1 opacity-90">
                        {REGLES_CANDIDATURE.map((regle) => <li key={regle}>{regle}</li>)}
                    </ol>
                    <p className="opacity-70">Ce n'est qu'un résumé : le <a href="/codex" className="link link-hover font-semibold">Codex</a> fait foi.</p>
                </div>
            </details>

            <div className="flex flex-col gap-3">
                {QUESTIONS_CANDIDATURE.map((question, index) => (
                    <article key={question.id} className="flex flex-col gap-2 bg-base-100 rounded-2xl p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            {/* La question en trois parties n'a pas de champ propre : son titre n'est pas une étiquette */}
                            {(() => {
                                const Titre = question.type === 'parcours' || question.type === 'ouinon' ? 'h4' : 'label';
                                const pastille = completes[question.id] ? 'badge-success' : textes[question.id] ? 'badge-warning' : 'badge-ghost';
                                return (
                                    <Titre id={`candidature-${question.id}-titre`} {...(Titre === 'label' ? { htmlFor: `candidature-${question.id}` } : {})} className="flex items-baseline gap-2 font-semibold">
                                        <span className={`badge badge-sm ${pastille}`}>{completes[question.id] ? <FontAwesomeIcon icon="fa-solid fa-check" /> : index + 1}</span>
                                        {question.question}
                                    </Titre>
                                );
                            })()}
                            <BoutonCopier texte={textes[question.id]} className="btn btn-xs btn-outline" />
                        </div>
                        <p className="text-xs opacity-70">{question.conseil}</p>
                        {champ(question)}
                        {question.type === 'parcours' ? (
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <Compteur texte={textes[question.id]} conseille={question.conseille} />
                                {textes[question.id] && !completes[question.id] ? (
                                    <span className="text-xs text-warning">Complétez d'abord votre expérience et votre projet : c'est ce que l'équipe lit en premier.</span>
                                ) : null}
                            </div>
                        ) : null}
                        {question.type === 'ouinon' && reponses[question.id] === 'non' ? (
                            <p className="text-xs opacity-70">Répondez tout de même honnêtement : l'équipe décide selon la règle du serveur.</p>
                        ) : null}
                    </article>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-sm">
                    <b>{pretes} réponse{pretes > 1 ? 's' : ''} sur {QUESTIONS_CANDIDATURE.length}</b>
                    <span className="opacity-70"> · Relisez-vous : l'équipe attend des réponses sérieuses et complètes. Refusé ? Une nouvelle candidature reste possible.</span>
                </p>
                <div className="flex flex-wrap gap-2 shrink-0">
                    <button type="button" className="btn btn-sm btn-ghost" onClick={effacer} disabled={commencees === 0}>
                        <FontAwesomeIcon icon="fa-solid fa-eraser" />
                        Effacer
                    </button>
                    <BoutonCopier texte={commencees ? toutes : ''} label="Copier tout (pour vos notes)" />
                    <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" onClick={marquerDiscordOuvert} className="btn btn-sm btn-primary">
                        <FontAwesomeIcon icon="fa-brands fa-discord" />
                        Postuler sur le Discord
                    </a>
                </div>
            </div>
        </Outil>
    );
}
