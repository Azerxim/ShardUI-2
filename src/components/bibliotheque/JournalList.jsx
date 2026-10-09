import ListCard from '@/components/ui/ListCard';

// ===== Liste de journaux =====
// Cartes de la bibliothèque, reprises sur les fiches (civilisation, religion…) pour les journaux qui y sont liés.

const DEFAULT_JOURNAUX_ICON = "fa-brands fa-discord";

const JournalCard = ({ journal }) => {
  const dateFounded = journal.published_date ? new Date(journal.published_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  return (
    <ListCard
      // Le lien est enregistré à la création (create_journal) ; à défaut, la page du journal
      href={journal.link || `/bibliotheque/journal/${journal.id}`}
      icon={journal.cover_icon}
      iconFallback={DEFAULT_JOURNAUX_ICON}
    //   iconColor={journal.cover_color}
      title={journal.title}
      badges={journal.is_public === false ? [{ text: "Privé", className: "badge-warning" }] : []}
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
