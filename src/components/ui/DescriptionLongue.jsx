import { useEffect, useState } from 'react';

import MarkdownTextEditor from '@/components/ui/MarkdownTextEditor';
import { getDescriptionLongue, updateDescriptionLongue } from '@/services/api';
import { alerteErreur } from '@/utils/alerteErreur';

// ===== Description longue d'une fiche =====
// Markdown affiché sous la première carte d'une civilisation, d'un commerce, d'une religion, d'une alliance ou d'un
// personnage, hors carte. Les gestionnaires de la fiche (auth : mêmes droits que l'API, crud_descriptions) cliquent dessus
// pour l'écrire avec l'éditeur Markdown ; rien n'est affiché aux autres tant qu'elle est vide.

const PLACEHOLDERS = {
  civilisation: "Écrire la description longue : histoire, peuple, coutumes, organisation…",
  commerce: "Écrire la description longue : histoire, savoir-faire, produits phares, organisation…",
  religion: "Écrire la description longue : croyances, rites, clergé, textes sacrés…",
  alliance: "Écrire la description longue : traité fondateur, engagements, histoire…",
  personnage: "Écrire la description longue : biographie, caractère, faits marquants…",
};

export default function DescriptionLongue({ type, id, auth = false }) {
  // Texte chargé pour une fiche (cle) : null tant que celle affichée n'a pas répondu
  const cle = `${type}-${id}`;
  const [charge, setCharge] = useState({ cle: null, texte: '' });
  const texte = charge.cle === cle ? charge.texte : null;

  useEffect(() => {
    let annule = false;
    getDescriptionLongue(type, id)
      .then((data) => { if (!annule) setCharge({ cle: `${type}-${id}`, texte: data?.description_longue || '' }); })
      .catch(() => { if (!annule) setCharge({ cle: `${type}-${id}`, texte: '' }); });
    return () => { annule = true; };
  }, [type, id]);

  // Promesse rejetée : l'éditeur reste ouvert avec le brouillon
  const enregistrer = async (valeur) => {
    try {
      const data = await updateDescriptionLongue(type, id, valeur);
      setCharge({ cle, texte: data?.description_longue || '' });
    } catch (error) {
      alerteErreur("Description non enregistrée", error);
      throw error;
    }
  };

  if (texte === null || (!texte && !auth)) return null;

  return (
    <section id="description" data-sommaire="Description" className="w-full scroll-mt-24">
      <MarkdownTextEditor
        value={texte}
        onChange={enregistrer}
        authorisation={auth}
        placeholder={PLACEHOLDERS[type]}
        defaultMode="cote"
      />
    </section>
  );
}
