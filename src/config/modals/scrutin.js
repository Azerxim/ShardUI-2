import { EGALITES, MODES } from '@/config/elections';

// Champs du formulaire d'ouverture (FormModal) et de modification d'un scrutin (Shard-API crud_elections).
// modification : le corps électoral ne se change plus une fois le scrutin ouvert ; postes : postes mis en jeu proposés.
export const scrutinFields = ({ entityType, postes = [], modification = false }) => [
    { name: 'title', label: 'Titre', type: 'text', required: true, placeholder: 'Élection du chancelier, désignation du grand prêtre…' },
    { name: 'description', label: 'Présentation', type: 'textarea', placeholder: 'Ce qui est en jeu, les règles particulières…' },
    ...(entityType === 'religion' && !modification ? [{
        name: 'corps', label: 'Qui vote', type: 'radio', required: true,
        options: [{ value: 'personnages', label: 'Les fidèles' }, { value: 'villes', label: 'Les villes' }],
        help: 'Fidèles : chaque personnage de cette foi vote. Villes : une voix par ville où la religion a la plus forte influence, donnée par le dirigeant de la ville.',
    }] : []),
    {
        name: 'mode', label: 'Vote', type: 'radio', required: true,
        options: Object.entries(MODES).map(([value, mode]) => ({ value, label: mode.label })),
        help: (values) => MODES[values.mode]?.texte,
    },
    {
        name: 'deux_tours', label: 'Tours', type: 'radio', required: true,
        options: [{ value: 'non', label: 'Un tour' }, { value: 'oui', label: 'Deux tours' }],
        help: 'Deux tours : sans majorité absolue, les deux premiers s\'affrontent au second tour, aussi long que le premier.',
    },
    {
        name: 'egalite', label: 'En cas d\'égalité', type: 'radio', required: true,
        options: Object.entries(EGALITES).map(([value, regle]) => ({ value, label: regle.label })),
        help: (values) => `${EGALITES[values.egalite]?.texte ?? ''} S'applique à une égalité sans second tour : à un tour, ou au second tour.`,
    },
    ...(entityType === 'civilisation' ? [{
        name: 'poste_id', label: 'Poste en jeu', type: 'select', placeholder: 'Aucun',
        options: postes.map((poste) => ({ value: poste.id, label: poste.label })),
        empty: 'Le gouvernement n\'a pas encore de poste : ajoutez-en dans la section « Gouvernement ».',
        help: 'À la clôture, l\'élu occupe ce poste.',
    }] : []),
    { name: 'vote_debut', label: 'Ouverture du vote', type: 'datetime-local', required: true, help: 'Heure réelle du serveur. Les candidatures se déposent jusque-là.' },
    { name: 'vote_fin', label: 'Clôture du vote', type: 'datetime-local', required: true, help: 'Les résultats restent cachés jusqu\'à la clôture.' },
    { name: 'date_rp', label: 'Date RP du scrutin', type: 'date', help: 'Facultative : avec elle, le résultat entre dans les chroniques.' },
];

// Valeurs du formulaire à partir d'un scrutin de l'API (heures réelles saisies en heure locale du serveur)
export const valeursScrutin = (scrutin) => ({
    title: scrutin.title,
    description: scrutin.description ?? '',
    mode: scrutin.mode,
    deux_tours: scrutin.deux_tours ? 'oui' : 'non',
    egalite: scrutin.egalite ?? 'personne',
    poste_id: scrutin.poste?.id ? String(scrutin.poste.id) : '',
    vote_debut: scrutin.vote_debut.slice(0, 16),
    vote_fin: scrutin.vote_fin.slice(0, 16),
    date_rp: scrutin.date_rp ?? '',
});

// Valeurs du formulaire vers le corps de requête de l'API
export const corpsScrutin = (values) => ({
    ...values,
    deux_tours: values.deux_tours === 'oui',
    poste_id: values.poste_id ? Number(values.poste_id) : null,
});
