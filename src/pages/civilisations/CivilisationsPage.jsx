import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';
import { checkMemberAuth } from "@/services/authorisation";

import Navbar from "@/components/layout/Navbar";
import DynamicModal from '@/components/modals/DynamicModal';
import DynamicNavbar from "@/components/layout/DynamicNavbar";
import SkeletonCivilisation from "@/components/civilisations/SkeletonCivilisation";
import ListCard from "@/components/ui/ListCard";
import ListCardTree from "@/components/ui/ListCardTree";
import BarreFiltres from "@/components/ui/BarreFiltres";
import { correspond, normalize, parDate, parNombre, parTitre, useFiltresMemorises } from "@/utils/filtres";
import { getSessionUser } from "@/services/session";
import { plural } from "@/utils/plural";

import { showModal } from '@/utils/showModal';
import { requireLogin } from '@/utils/requireLogin';
import { civilisationModal } from '@/config/modals/civilisation';
import { religionModal } from '@/config/modals/religion';
import {
  getCivilisations
} from "@/services/api"
import GrimoireHero from "@/components/layout/GrimoireHero";
import EtatVide from '@/components/ui/EtatVide';

// Une civilisation privée n'est visible que par ses dirigeants (Fondateur, Admin) et les administrateurs (auth)
const estVisible = (civilisation) => civilisation.is_public || civilisation.auth;

// ===== Filtres (BarreFiltres) =====
const FILTRES_DEFAUT = { recherche: '', statut: 'toutes', tri: 'titre-asc', visibilite: 'toutes', mesCivilisations: false };

const STATUTS = {
  toutes: 'Toutes les civilisations',
  independantes: 'Indépendantes',
  dirigeantes: 'Qui en dirigent d\'autres',
  dirigees: 'Dirigées',
};
const VISIBILITES = { toutes: 'Publiques et privées', publiques: 'Publiques seulement', privees: 'Privées seulement' };

const population = (civilisation) => (civilisation.villes || []).reduce((total, ville) => total + (Number(ville.population) || 0), 0);

const TRIS = {
  'titre-asc': { label: 'Nom : A → Z', compare: parTitre((c) => c.title, 1) },
  'titre-desc': { label: 'Nom : Z → A', compare: parTitre((c) => c.title, -1) },
  'membres-desc': { label: 'Plus de membres', compare: parNombre((c) => (c.members || []).length, -1) },
  'villes-desc': { label: 'Plus de villes', compare: parNombre((c) => (c.villes || []).length, -1) },
  'population-desc': { label: 'Plus peuplées', compare: parNombre(population, -1) },
  'fondation-asc': { label: 'Fondation RP : anciennes', compare: parDate((c) => c.date_founded, 1) },
  'fondation-desc': { label: 'Fondation RP : récentes', compare: parDate((c) => c.date_founded, -1) },
};
const TRI_LIBELLES = Object.fromEntries(Object.entries(TRIS).map(([value, { label }]) => [value, label]));

const estDirigee = (civilisation) => Boolean(civilisation.dirigeante_civilisation_id) && civilisation.dirigeante_civilisation_id !== civilisation.id;

// Visibilité, puis recherche (nom, description, fondateur, villes), statut, visibilité choisie, « mes civilisations » et tri
const filtrerCivilisations = (civilisations, filtres, user) => {
  const query = normalize(filtres.recherche.trim());
  const visibles = civilisations.filter(estVisible);
  const dirigeantes = new Set(visibles.filter(estDirigee).map((civilisation) => civilisation.dirigeante_civilisation_id));
  return visibles
    .filter((civilisation) => correspond(query, [
      civilisation.title,
      civilisation.description,
      ...(civilisation.members || []).filter((member) => member.role === 'Fondateur').map((member) => member.username),
      ...(civilisation.villes || []).map((ville) => ville.title),
    ]))
    .filter((civilisation) => ({
      toutes: true,
      independantes: !estDirigee(civilisation),
      dirigeantes: dirigeantes.has(civilisation.id),
      dirigees: estDirigee(civilisation),
    })[filtres.statut])
    .filter((civilisation) => filtres.visibilite === 'toutes' || (filtres.visibilite === 'privees') === !civilisation.is_public)
    .filter((civilisation) => !filtres.mesCivilisations || (civilisation.members || []).some((member) => member.user_id === user?.id))
    .sort(TRIS[filtres.tri].compare);
};

// Regroupe les civilisations dirigées (dirigeante_civilisation_id != 0) sous leur dirigeante, dans l'ordre reçu (tri).
// Une dirigée dont la dirigeante n'est pas affichée (privée ou écartée par les filtres) reste à la racine.
const buildCivilisationTree = (visibles) => {
  const parIdentifiant = new Map(visibles.map((civilisation) => [civilisation.id, civilisation]));

  const racines = [];
  const dirigees = new Map();

  visibles.forEach((civilisation) => {
    const dirigeanteId = civilisation.dirigeante_civilisation_id;
    if (dirigeanteId && dirigeanteId !== civilisation.id && parIdentifiant.has(dirigeanteId)) {
      dirigees.set(dirigeanteId, [...(dirigees.get(dirigeanteId) || []), civilisation]);
    } else {
      racines.push(civilisation);
    }
  });

  return racines.map((civilisation) => ({ civilisation, dirigees: dirigees.get(civilisation.id) || [] }));
};

// dirigee : carte affichée dans le bloc de sa dirigeante
const CivilisationCard = ({ civilisation, dirigees = [], dirigee = false }) => {
  const members = civilisation.members || [];
  const villes = civilisation.villes || [];
  const founder = members.find((member) => member.role === "Fondateur");
  const capitale = villes.find((ville) => ville.is_capital);

  const badges = [
    // ...(dirigees.length > 0 ? [{ text: "Dirigeante", className: "badge-primary" }] : []),
    // ...(dirigee ? [{ text: "Dirigée", className: "badge-neutral" }] : []),
    ...(civilisation.is_public ? [] : [{ text: "Privée", className: "badge-warning" }]),
  ];

  const stats = [
    { icon: "fa-solid fa-users", text: plural(members.length, "membre") },
    { icon: "fa-solid fa-city", text: plural(villes.length, "ville") },
    ...(capitale ? [{ icon: "fa-solid fa-archway", text: `Capitale : ${capitale.title}` }] : []),
    ...(dirigees.length > 0 ? [{ icon: "fa-solid fa-crown", text: `Dirige ${plural(dirigees.length, "civilisation")}` }] : []),
  ];

  return (
    <ListCard
      href={civilisation.link}
      icon={dirigee ? "fa-solid fa-flag-checkered" : "fa-solid fa-flag"}
      title={civilisation.title}
      badges={badges}
      subtitle={founder?.username ? `Fondée par ${founder.username}` : null}
      description={civilisation.description}
      stats={stats}
    />
  );
};

// Dirigeante en tête, puis ses dirigées en arborescence
const CivilisationGroup = ({ civilisation, dirigees }) => (
  <ListCardTree
    parent={<CivilisationCard civilisation={civilisation} dirigees={dirigees} />}
    label={{ icon: "fa-solid fa-crown", text: `Civilisations dirigées par ${civilisation.title}` }}
    items={dirigees.map((dirigee) => ({ key: dirigee.id, node: <CivilisationCard civilisation={dirigee} dirigee /> }))}
  />
);

const CivilisationList = ({ civilisations }) => (
  <div className="grid grid-cols-1 gap-4 w-full">
    {buildCivilisationTree(civilisations).map(({ civilisation, dirigees }) => (
      dirigees.length > 0
        ? <CivilisationGroup key={civilisation.id} civilisation={civilisation} dirigees={dirigees} />
        : <CivilisationCard key={civilisation.id} civilisation={civilisation} />
    ))}
  </div>
);

export default function CivilisationsPage() {

  const [civilisations, setCivilisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageCivilisations, setStorageCivilisations] = useState(JSON.parse(localStorage.getItem('civilisations')) || []);
  const [filtres, changerFiltres] = useFiltresMemorises('civilisations-filtres', FILTRES_DEFAUT, { statut: STATUTS, tri: TRIS, visibilite: VISIBILITES });
  const user = getSessionUser();

  useEffect(() => {
    const MIN_LOADING_TIME = 1000;
    const startTime = Date.now();

    getCivilisations()
      .then((data) => {
        // console.log('Civilisations fetched:', data);
        // Ajouter les liens pour redirection vers la page de détail
        const CivilisationsWithLinks = data.map(({ civilisation, members, villes }) => ({
          ...civilisation,
          members,
          villes: villes || [],
          auth: checkMemberAuth(members ? members : []),
          link: `/civilisation/${civilisation.id}`
        }));
        setCivilisations(CivilisationsWithLinks);
        setStorageCivilisations(CivilisationsWithLinks);
        localStorage.setItem('civilisations', JSON.stringify(CivilisationsWithLinks));
        // console.log('Civilisations mises à jour:', CivilisationsWithLinks);
      })
      .catch((error) => {
        console.error('Error fetching civilisations:', error);
        setCivilisations([]);
        setStorageCivilisations([]);
        localStorage.removeItem('civilisations');
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      });
  }, []);

  const updateCivilisation = (data) => {
    // console.log("Nouvelle civilisation ajoutée:", data);
    const nouvelle = { ...data.civilisation, members: [data.member], villes: [], link: `/civilisation/${data.civilisation.id}` };
    setCivilisations((prevCivilisations) => [...prevCivilisations, nouvelle]);
    setStorageCivilisations((prevStorageCivilisations) => [...prevStorageCivilisations, nouvelle]);
    localStorage.setItem('civilisations', JSON.stringify([...storageCivilisations, nouvelle]));
    // console.log("Civilisations mises à jour:", civilisations);
  };

  // Pendant le chargement : la dernière liste gardée dans le navigateur
  const source = loading ? storageCivilisations : civilisations;
  const affichees = filtrerCivilisations(source, filtres, user);

  return (
    <>
      <Navbar active="civilisations" />
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <GrimoireHero
            icon="fa-solid fa-flag"
            title="Les Civilisations de Tetrago"
            description="Des clans aux royaumes, chaque civilisation porte sa loi, son territoire et son peuple : voici la carte vivante de Tetrago. Rejoignez-en une, ou forgez la vôtre."
            topRight={
              <div className="flex flex-col gap-2">
                <button onClick={() => requireLogin(() => showModal(civilisationModal, "add"), "fonder une civilisation")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Civilisation" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                  <span className="flex">Civilisation</span>
                  <FontAwesomeIcon icon="fas fa-plus" />
                </button>
                <button onClick={() => requireLogin(() => showModal(religionModal, "add"), "fonder une religion")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Religion" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                  <span className="flex">Religion</span>
                  <FontAwesomeIcon icon="fas fa-plus" />
                </button>
              </div>
            }
          />
          {/* <DynamicNavbar active_id="civilisations" /> */}

          <BarreFiltres
            filtres={filtres}
            defauts={FILTRES_DEFAUT}
            onChange={changerFiltres}
            recherche={{ placeholder: "Nom, fondateur, ville…", label: "Rechercher une civilisation" }}
            selects={[
              { name: 'statut', label: 'Statut', options: STATUTS },
              { name: 'tri', label: 'Trier', options: TRI_LIBELLES, className: 'sm:w-56' },
              ...(user ? [{ name: 'visibilite', label: 'Visibilité', options: VISIBILITES, className: 'sm:w-52' }] : []),
            ]}
            toggles={user ? [{ name: 'mesCivilisations', label: 'Mes civilisations' }] : []}
          />

          {loading && storageCivilisations.length === 0 ? (
            <div className="flex flex-col gap-4 w-full">
              <SkeletonCivilisation />
              <SkeletonCivilisation />
              <SkeletonCivilisation />
            </div>
          ) : source.length === 0 ? (
            <EtatVide
              icon="fa-solid fa-flag"
              texte="Aucune civilisation n'a encore été fondée."
              aide="Une civilisation rassemble des joueurs sous une même bannière, avec ses villes, ses membres et son gouvernement."
              action={{ label: "Fonder une civilisation", icon: "fa-solid fa-plus", onClick: () => requireLogin(() => showModal(civilisationModal, "add"), "fonder une civilisation") }}
            />
          ) : affichees.length === 0 ? (
            <EtatVide
              icon="fa-solid fa-magnifying-glass"
              texte="Aucune civilisation ne correspond à vos filtres."
              action={{ label: "Effacer les filtres", icon: "fa-solid fa-xmark", onClick: () => changerFiltres(FILTRES_DEFAUT) }}
            />
          ) : (
            <CivilisationList civilisations={affichees} />
          )}

          <DynamicModal config={civilisationModal} mode="add" onSubmit={(civilisation) => { updateCivilisation(civilisation) }} />

          <DynamicModal config={religionModal} mode="add" />

        </div>
      </main>
    </>
  );
}
