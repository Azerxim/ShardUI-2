import ListCard from '@/components/ui/ListCard';
import { categorieJournal } from '@/config/journaux';
import { dateRp } from '@/config/chroniques';
import { couleurValide } from '@/utils/couleurFiche';

// ===== Liste de journaux =====
// Cartes de la bibliothèque, reprises sur les fiches (civilisation, religion…) pour les journaux qui y sont liés.

const DEFAULT_JOURNAUX_ICON = "fa-brands fa-discord";

const JournalCard = ({ journal }) => {
  // Date RP « 0003-03-12 » → « 12 mars de l'an 3 »
  const dateFounded = journal.published_date ? dateRp(String(journal.published_date).slice(0, 10)) : null;

  return (
    <ListCard
      // Le lien est enregistré à la création (create_journal) ; à défaut, la page du journal
      href={journal.link || `/bibliotheque/journal/${journal.id}`}
      icon={journal.cover_icon}
      iconFallback={DEFAULT_JOURNAUX_ICON}
      iconColor={couleurValide(journal.cover_color)}
      title={journal.title}
      badges={[
        { text: categorieJournal(journal.categorie).label, className: "badge-ghost" },
        ...(journal.is_public === false ? [{ text: "Privé", className: "badge-warning" }] : []),
      ]}
      subtitle={dateFounded ? `Publié le ${dateFounded}` : null}
      description={journal.description}
    />
  );
};

export default function JournalList({ journaux }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {journaux.map((journal) => (
        <JournalCard key={journal.id} journal={journal} />
      ))}
    </div>
  );
}
