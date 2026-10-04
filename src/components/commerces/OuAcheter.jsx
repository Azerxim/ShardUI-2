import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { rechercherArticles } from '@/services/api';
import { CATEGORIES_ARTICLES, categorieArticle, prixLot } from '@/config/catalogue';
import { MAPS_BASE_URL } from '@/config/maps';
import { messageErreur } from '@/utils/alerteErreur';
import { plural } from '@/utils/plural';

// ===== Où acheter ? =====
// Recherche dans les catalogues des magasins publics des commerces publics (Shard-API crud_catalogue.rechercher) :
// les articles en stock d'abord, du moins cher au plus cher à l'unité. villes : Map des villes publiques (filtre).

function Resultat({ article }) {
    const { magasin, commerce, ville, dimension } = article;
    const categorie = categorieArticle(article.categorie);
    return (
        <li className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-base-100 rounded-xl px-3 py-2 ${article.en_stock ? '' : 'opacity-60'}`}>
            <span className="flex flex-row items-center gap-3 flex-1 min-w-0">
                <FontAwesomeIcon icon={categorie.icon} className="opacity-70 w-4 shrink-0" title={categorie.label} />
                <span className="flex flex-col min-w-0">
                    <span className="flex flex-row flex-wrap items-center gap-2">
                        <span className="font-semibold break-words">{article.title}</span>
                        {!article.en_stock && <span className="badge badge-sm badge-warning">Rupture</span>}
                    </span>
                    <span className="text-sm opacity-80 flex flex-row flex-wrap items-center gap-x-2">
                        <a href={`/commerce/${commerce.id}#magasin-${magasin.id}`} className="link link-hover">{magasin.title}</a>
                        {magasin.title !== commerce.title && <span className="opacity-70">({commerce.title})</span>}
                        {ville && (
                            <a href={`/civilisation/${ville.civilisation_id}/ville/${ville.id}`} className="link link-hover flex items-center gap-1">
                                <FontAwesomeIcon icon="fa-solid fa-city" className="opacity-70" />
                                {ville.title}
                            </a>
                        )}
                    </span>
                    {article.description && <span className="text-xs opacity-70 break-words">{article.description}</span>}
                </span>
            </span>
            <span className="flex flex-row items-center gap-2 shrink-0 pl-7 sm:pl-0">
                <span className="font-semibold tabular-nums">{prixLot(article.prix, article.quantite)}</span>
                {dimension?.link && magasin.x != null && magasin.z != null ? (
                    <a
                        href={`${MAPS_BASE_URL}/${dimension.link}-commerces#x=${magasin.x}&z=${magasin.z}&zoom=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-ghost btn-circle"
                        aria-label={`${magasin.title} sur la carte (X ${magasin.x}, Z ${magasin.z})`}
                        title={`X ${magasin.x} · Z ${magasin.z}`}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-map-location-dot" />
                    </a>
                ) : null}
            </span>
        </li>
    );
}

export default function OuAcheter({ villes = new Map() }) {
    const [criteres, setCriteres] = useState({ q: '', categorie: '', villeId: '', enStock: false });
    const [etat, setEtat] = useState({ chargement: false, erreur: null, donnees: null });

    const changer = (cle, valeur) => setCriteres((prev) => ({ ...prev, [cle]: valeur }));
    const vide = !criteres.q.trim() && !criteres.categorie;

    const chercher = async (event) => {
        event.preventDefault();
        if (vide) return;
        setEtat({ chargement: true, erreur: null, donnees: null });
        try {
            setEtat({ chargement: false, erreur: null, donnees: await rechercherArticles(criteres) });
        } catch (error) {
            setEtat({ chargement: false, erreur: messageErreur(error), donnees: null });
        }
    };

    const villesTriees = [...villes.values()].sort((a, b) => a.title.localeCompare(b.title));
    const { donnees } = etat;

    return (
        <section id="ou-acheter" className="flex flex-col gap-3 w-full bg-base-200 rounded-3xl p-4 scroll-mt-24">
            <h2 className="flex flex-row items-center gap-2 text-xl">
                <FontAwesomeIcon icon="fa-solid fa-magnifying-glass-dollar" />
                Où acheter ?
            </h2>
            <form onSubmit={chercher} className="flex flex-col gap-2" role="search" aria-label="Chercher un article dans les boutiques">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="search"
                        name="q"
                        value={criteres.q}
                        onChange={(e) => changer('q', e.target.value)}
                        placeholder="Ex. flèches, pain, épée enchantée…"
                        aria-label="Article recherché"
                        className="input input-ghost bg-base-100 w-full sm:flex-1"
                    />
                    <button type="submit" className="btn btn-primary rounded-3xl" disabled={vide || etat.chargement}>
                        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                        Chercher
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                    <select value={criteres.categorie} onChange={(e) => changer('categorie', e.target.value)} aria-label="Catégorie" className="select select-sm select-ghost bg-base-100 w-full sm:w-auto">
                        <option value="">Toutes les catégories</option>
                        {CATEGORIES_ARTICLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    {villesTriees.length > 0 && (
                        <select value={criteres.villeId} onChange={(e) => changer('villeId', e.target.value)} aria-label="Ville" className="select select-sm select-ghost bg-base-100 w-full sm:w-auto">
                            <option value="">Toutes les villes</option>
                            {villesTriees.map((ville) => <option key={ville.id} value={ville.id}>{ville.title}</option>)}
                        </select>
                    )}
                    <label className="flex flex-row items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={criteres.enStock} onChange={(e) => changer('enStock', e.target.checked)} className="checkbox checkbox-sm" />
                        En stock seulement
                    </label>
                </div>
            </form>

            {etat.chargement && <div className="flex justify-center py-4"><span className="loading loading-spinner"></span></div>}
            {etat.erreur && <p className="text-sm text-error">{etat.erreur}</p>}
            {donnees && (
                donnees.resultats.length === 0 ? (
                    <p className="text-sm opacity-80">Aucune boutique ne propose cet article pour l'instant.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm opacity-70">
                            {plural(donnees.total, 'offre')} : en stock d'abord, du moins cher au plus cher à l'unité
                            {donnees.total > donnees.resultats.length ? ` (les ${donnees.resultats.length} premières)` : ''}.
                        </p>
                        <ul className="flex flex-col gap-1">
                            {donnees.resultats.map((article) => <Resultat key={article.id} article={article} />)}
                        </ul>
                    </div>
                )
            )}
        </section>
    );
}
