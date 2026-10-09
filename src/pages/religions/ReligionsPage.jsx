import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';
import { checkMemberAuth } from "@/services/authorisation";

import Navbar from "@/components/layout/Navbar";
import DynamicModal from '@/components/modals/DynamicModal';
import DynamicNavbar from "@/components/layout/DynamicNavbar";
import SkeletonCivilisation from "@/components/civilisations/SkeletonCivilisation";
import ListCard from "@/components/ui/ListCard";
import { plural } from "@/utils/plural";

import { showModal } from '@/utils/showModal';
import { requireLogin } from '@/utils/requireLogin';
import { DEFAULT_RELIGION_ICON, religionColor, religionIcon } from '@/utils/religionColor';
import { religionModal } from '@/config/modals/religion';
import {
  getReligions
} from "@/services/api"
import GrimoireHero from "@/components/layout/GrimoireHero";
import EtatVide from '@/components/ui/EtatVide';
import BarreFiltres from "@/components/ui/BarreFiltres";
import { correspond, normalize, parDate, parNombre, parTitre, useFiltresMemorises } from "@/utils/filtres";
import { getSessionUser } from "@/services/session";

// ===== Filtres (BarreFiltres) =====
const FILTRES_DEFAUT = { recherche: '', ville: 'toutes', tri: 'titre-asc', visibilite: 'toutes', mesReligions: false };

const VISIBILITES = { toutes: 'Publiques et privées', publiques: 'Publiques seulement', privees: 'Privées seulement' };

// villes : [{ villes_religions: { influence }, ville }] (getReligions)
const villesPubliques = (religion) => (religion.villes || []).map(({ ville }) => ville).filter((ville) => ville && ville.is_public !== false);
const influence = (religion) => (religion.villes || []).reduce((total, { villes_religions: lien }) => total + (Number(lien?.influence) || 0), 0);

const TRIS = {
  'titre-asc': { label: 'Nom : A → Z', compare: parTitre((r) => r.title, 1) },
  'titre-desc': { label: 'Nom : Z → A', compare: parTitre((r) => r.title, -1) },
  'membres-desc': { label: 'Plus de fidèles', compare: parNombre((r) => (r.members || []).length, -1) },
  'villes-desc': { label: 'Présentes dans plus de villes', compare: parNombre((r) => (r.villes || []).length, -1) },
  'influence-desc': { label: 'Plus influentes', compare: parNombre(influence, -1) },
  'fondation-asc': { label: 'Fondation RP : anciennes', compare: parDate((r) => r.date_founded, 1) },
  'fondation-desc': { label: 'Fondation RP : récentes', compare: parDate((r) => r.date_founded, -1) },
};
const TRI_LIBELLES = Object.fromEntries(Object.entries(TRIS).map(([value, { label }]) => [value, label]));

const estMembre = (religion, user) => (religion.members || []).some((member) => member.user_id === user?.id);

// Une religion privée n'est visible que par ses membres et les administrateurs ; puis recherche (nom, description,
// fondateur, villes), ville, visibilité choisie, « mes religions » et tri
const filtrerReligions = (religions, filtres, villeFiltre, user) => {
  const query = normalize(filtres.recherche.trim());
  return religions
    .filter((religion) => religion.is_public !== false || user?.is_admin || estMembre(religion, user))
    .filter((religion) => correspond(query, [
      religion.title,
      religion.description,
      ...(religion.members || []).filter((member) => member.role === 'Fondateur').map((member) => member.username),
      ...villesPubliques(religion).map((ville) => ville.title),
    ]))
    .filter((religion) => villeFiltre === 'toutes' || villesPubliques(religion).some((ville) => String(ville.id) === villeFiltre))
    .filter((religion) => filtres.visibilite === 'toutes' || (filtres.visibilite === 'privees') === (religion.is_public === false))
    .filter((religion) => !filtres.mesReligions || estMembre(religion, user))
    .sort(TRIS[filtres.tri].compare);
};

const ReligionCard = ({ religion }) => {
  const members = religion.members || [];
  const villes = religion.villes || [];
  const dateFounded = religion.date_founded ? new Date(religion.date_founded).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  return (
    <ListCard
      href={religion.link}
      icon={religionIcon(religion)}
      iconFallback={DEFAULT_RELIGION_ICON}
      iconColor={religionColor(religion)}
      title={religion.title}
      badges={religion.is_public === false ? [{ text: "Privée", className: "badge-warning" }] : []}
      subtitle={dateFounded ? `Fondée le ${dateFounded}` : null}
      description={religion.description}
      stats={[
        { icon: "fa-solid fa-users", text: plural(members.length, "membre") },
        { icon: "fa-solid fa-city", text: villes.length > 0 ? `Présente dans ${plural(villes.length, "ville")}` : "Présente dans aucune ville" },
      ]}
    />
  );
};

const ReligionList = ({ religions }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
    {religions.map((religion) => (
      <ReligionCard key={religion.id} religion={religion} />
    ))}
  </div>
);

export default function ReligionsPage() {


  const [religions, setReligions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageReligions, setStorageReligions] = useState(JSON.parse(localStorage.getItem('religions')) || []);
  const [filtres, changerFiltres] = useFiltresMemorises('religions-filtres', FILTRES_DEFAUT, { tri: TRIS, visibilite: VISIBILITES });
  const user = getSessionUser();

  useEffect(() => {
    getReligions()
      .then((data) => {
        // console.log('Religions fetched:', data);
        // Ajouter les liens pour redirection vers la page de détail
        const ReligionsWithLinks = data.map(({ religion, members, villes }) => ({
          ...religion,
          members,
          villes: villes || [],
          auth: checkMemberAuth(members ? members : []),
          link: `/religion/${religion.id}`
        }));
        setReligions(ReligionsWithLinks);
        setStorageReligions(ReligionsWithLinks);
        localStorage.setItem('religions', JSON.stringify(ReligionsWithLinks));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching religions:', error);
        setReligions([]);
        setStorageReligions([]);
        localStorage.removeItem('religions');
        setLoading(false);
      });
  }, []);

  const updateReligion = (data) => {
    // console.log("Nouvelle religion ajoutée:", data);
    const nouvelle = { ...data.religion, members: [data.member], villes: [], link: `/religion/${data.religion.id}` };
    setReligions((prevReligions) => [...prevReligions, nouvelle]);
    setStorageReligions((prevStorageReligions) => [...prevStorageReligions, nouvelle]);
    localStorage.setItem('religions', JSON.stringify([...storageReligions, nouvelle]));
    // console.log("Religions mises à jour:", religions);
  };

  // Pendant le chargement : la dernière liste gardée dans le navigateur
  const source = loading ? storageReligions : religions;

  // Filtre « ville » : les villes publiques où une religion est présente. Une ville gardée qui n'y figure plus est ignorée.
  const villes = new Map(source.flatMap(villesPubliques).map((ville) => [ville.id, ville]));
  const optionsVilles = [
    ['toutes', 'Toutes les villes'],
    ...[...villes.values()].sort((a, b) => (a.title || '').localeCompare(b.title || '')).map((ville) => [String(ville.id), ville.title]),
  ];
  const villeFiltre = optionsVilles.some(([value]) => value === filtres.ville) ? filtres.ville : 'toutes';
  const affichees = filtrerReligions(source, filtres, villeFiltre, user);

  return (
    <>
      <Navbar active="religions" />
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <GrimoireHero
            icon="fa-solid fa-flag"
            title="Les Religions de Tetrago"
            description="Des cultes aux grandes religions, chaque foi porte ses croyances, ses rituels et ses fidèles : voici la carte vivante de Tetrago. Rejoignez-en une, ou fondez la vôtre."
            topRight={
              <div className="flex flex-col gap-2">
                <button onClick={() => requireLogin(() => showModal(religionModal, "add"), "fonder une religion")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Religion" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                  <span className="flex">Religion</span>
                  <FontAwesomeIcon icon="fas fa-plus" />
                </button>
              </div>
            }
          />
          {/* <DynamicNavbar active_id="religions" /> */}

          <BarreFiltres
            filtres={{ ...filtres, ville: villeFiltre }}
            defauts={FILTRES_DEFAUT}
            onChange={changerFiltres}
            recherche={{ placeholder: "Nom, fondateur, ville…", label: "Rechercher une religion" }}
            selects={[
              { name: 'ville', label: 'Présente à', options: optionsVilles, className: 'sm:w-48' },
              { name: 'tri', label: 'Trier', options: TRI_LIBELLES, className: 'sm:w-60' },
              ...(user ? [{ name: 'visibilite', label: 'Visibilité', options: VISIBILITES, className: 'sm:w-52' }] : []),
            ]}
            toggles={user ? [{ name: 'mesReligions', label: 'Mes religions' }] : []}
          />

          {loading && storageReligions.length === 0 ? (
            <div className="flex flex-col gap-4 w-full">
              <SkeletonCivilisation />
              <SkeletonCivilisation />
              <SkeletonCivilisation />
            </div>
          ) : source.length === 0 ? (
            <EtatVide
              icon="fa-solid fa-place-of-worship"
              texte="Aucune religion n'a encore été fondée."
              aide="Une religion réunit des fidèles et gagne de l'influence dans les villes où elle s'implante."
              action={{ label: "Fonder une religion", icon: "fa-solid fa-plus", onClick: () => requireLogin(() => showModal(religionModal, "add"), "fonder une religion") }}
            />
          ) : affichees.length === 0 ? (
            <EtatVide
              icon="fa-solid fa-magnifying-glass"
              texte="Aucune religion ne correspond à vos filtres."
              action={{ label: "Effacer les filtres", icon: "fa-solid fa-xmark", onClick: () => changerFiltres(FILTRES_DEFAUT) }}
            />
          ) : (
            <ReligionList religions={affichees} />
          )}

          <DynamicModal config={religionModal} mode="add" onSubmit={(religion) => { updateReligion(religion) }} />

        </div>
      </main>
    </>
  );
}
