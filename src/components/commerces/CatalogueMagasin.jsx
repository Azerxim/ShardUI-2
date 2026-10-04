import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import FormModal from '@/components/modals/FormModal';
import { createArticle, deleteArticle, getCatalogueMagasin, updateArticle } from '@/services/api';
import { CATEGORIES_ARTICLES, categorieArticle, prixLot } from '@/config/catalogue';
import { MONNAIE } from '@/config/monnaie';
import { showModalID } from '@/utils/showModal';
import { runAction } from '@/utils/conflits';
import { plural } from '@/utils/plural';

// ===== Catalogue d'un magasin =====
// Articles vendus par lot, prix en tetras (Shard-API crud_catalogue). Tenu par le Fondateur et les Admins du commerce
// (auth), comme le magasin. Replié d'office au-delà de PLIE_AU_DELA articles pour ne pas allonger la fiche.

const PLIE_AU_DELA = 8;

const CHAMPS = [
    { name: 'title', label: 'Article', type: 'text', required: true, placeholder: 'Ex. Flèches, Épée en fer, Réparation d\'armure' },
    { name: 'categorie', label: 'Catégorie', type: 'select', required: true, options: CATEGORIES_ARTICLES.map(({ value, label }) => ({ value, label })) },
    { name: 'prix', label: `Prix en ${MONNAIE.pluriel}`, type: 'number', required: true, placeholder: 'Ex. 1', help: `Prix du lot entier (1 ${MONNAIE.nom} = 1 diamant). 0 : offert.` },
    { name: 'quantite', label: 'Taille du lot', type: 'number', required: true, placeholder: 'Ex. 16', help: '« 16 flèches pour 1 tetra » : lot de 16, prix 1.' },
    { name: 'en_stock', label: 'Disponibilité', type: 'radio', required: true, options: [{ value: true, label: 'En stock' }, { value: false, label: 'En rupture' }] },
    { name: 'description', label: 'Précisions', type: 'textarea', placeholder: 'Facultatives : enchantements, durabilité, sur commande…' },
];

const valeursInitiales = (article) => ({
    title: article?.title ?? '',
    categorie: article?.categorie ?? '',
    prix: article ? String(article.prix) : '',
    quantite: article ? String(article.quantite) : '1',
    en_stock: article ? article.en_stock : true,
    description: article?.description ?? '',
});

export default function CatalogueMagasin({ magasin, auth = false }) {
    const [articles, setArticles] = useState(null);
    const [edition, setEdition] = useState(null); // { article, count } : article null pour un ajout
    const modalId = `catalogue-article-${magasin.id}`;

    const charger = () => getCatalogueMagasin(magasin.id)
        .then((data) => setArticles(Array.isArray(data) ? data : []))
        .catch(() => setArticles([]));

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [magasin.id]);

    useEffect(() => {
        if (edition) showModalID(modalId);
    }, [edition, modalId]);

    const ouvrir = (article = null) => setEdition((prev) => ({ article, count: (prev?.count ?? 0) + 1 }));

    const enregistrer = async (values) => {
        const corps = {
            title: values.title,
            categorie: values.categorie,
            prix: Number.parseInt(values.prix, 10),
            quantite: Number.parseInt(values.quantite, 10),
            en_stock: values.en_stock === true || values.en_stock === 'true',
            description: values.description,
        };
        if (!Number.isInteger(corps.prix) || corps.prix < 0) throw new Error('Le prix est un nombre entier de tetras, 0 ou plus.');
        if (!Number.isInteger(corps.quantite) || corps.quantite < 1) throw new Error('Un lot contient au moins un article.');
        const data = edition.article
            ? await updateArticle(edition.article.id, corps)
            : await createArticle({ ...corps, magasin_id: magasin.id });
        Swal.fire({ icon: 'success', title: 'Succès', text: data?.text ?? "C'est fait." });
        charger();
    };

    const retirer = async (article) => {
        const result = await runAction(() => deleteArticle(article.id), {
            confirm: { title: `Retirer « ${article.title} » ?`, text: 'Il disparaîtra du catalogue et de la recherche.', button: 'Retirer' },
        });
        if (result) charger();
    };

    if (articles === null) return null;
    if (articles.length === 0 && !auth) return null;

    return (
        <div className="flex flex-col gap-2">
            <details className="group" open={articles.length <= PLIE_AU_DELA}>
                <summary className="flex flex-row flex-wrap items-center gap-2 cursor-pointer select-none font-semibold list-none">
                    <FontAwesomeIcon icon="fa-solid fa-chevron-right" className="w-3 transition-transform group-open:rotate-90 opacity-70" />
                    <FontAwesomeIcon icon="fa-solid fa-tags" />
                    <span>Catalogue</span>
                    <span className="font-normal text-sm opacity-70">· {articles.length === 0 ? 'vide' : plural(articles.length, 'article')}</span>
                </summary>
                {articles.length === 0 ? (
                    <p className="text-sm opacity-70 mt-2">Aucun article : ajoutez ce que vend ce magasin pour qu'on le trouve dans « Où acheter ? ».</p>
                ) : (
                    <ul className="flex flex-col gap-1 mt-2">
                        {articles.map((article) => {
                            const categorie = categorieArticle(article.categorie);
                            return (
                                // Sur un écran étroit, le prix et les boutons passent sous le nom plutôt que de l'écraser
                                <li key={article.id} className={`flex flex-row flex-wrap items-center gap-x-3 gap-y-1 bg-base-100 rounded-xl px-3 py-2 ${article.en_stock ? '' : 'opacity-60'}`}>
                                    <FontAwesomeIcon icon={categorie.icon} className="opacity-70 w-4 shrink-0" title={categorie.label} />
                                    <span className="flex flex-col flex-1 min-w-40">
                                        <span className="flex flex-row flex-wrap items-center gap-2">
                                            <span className="font-semibold break-words">{article.title}</span>
                                            {!article.en_stock && <span className="badge badge-sm badge-warning">Rupture</span>}
                                        </span>
                                        {article.description && <span className="text-xs opacity-70 break-words">{article.description}</span>}
                                    </span>
                                    <span className="flex flex-row items-center gap-1 shrink-0 ml-auto">
                                        <span className="text-sm font-semibold tabular-nums text-right">{prixLot(article.prix, article.quantite)}</span>
                                        {auth && (
                                            <span className="flex flex-row">
                                                <button type="button" className="btn btn-xs btn-ghost btn-circle" aria-label={`Modifier ${article.title}`} onClick={() => ouvrir(article)}>
                                                    <FontAwesomeIcon icon="fa-solid fa-pen" />
                                                </button>
                                                <button type="button" className="btn btn-xs btn-ghost btn-circle text-error" aria-label={`Retirer ${article.title}`} onClick={() => retirer(article)}>
                                                    <FontAwesomeIcon icon="fa-solid fa-trash" />
                                                </button>
                                            </span>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </details>
            {auth && (
                <button type="button" className="btn btn-sm btn-ghost bg-base-100 self-start" onClick={() => ouvrir()}>
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                    Ajouter un article
                </button>
            )}
            {auth && edition ? (
                <FormModal
                    key={`${modalId}-${edition.count}`}
                    id={modalId}
                    title={edition.article ? `Modifier « ${edition.article.title} »` : `Nouvel article · ${magasin.title}`}
                    fields={CHAMPS}
                    initialValues={valeursInitiales(edition.article)}
                    submitLabel={edition.article ? 'Enregistrer' : 'Ajouter'}
                    onSubmit={enregistrer}
                />
            ) : null}
        </div>
    );
}
