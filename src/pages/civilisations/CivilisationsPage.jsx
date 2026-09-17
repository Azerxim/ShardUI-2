import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';
import { checkMemberAuth } from "@/services/authorisation";

import Navbar from "@/components/layout/Navbar";
import DynamicModal from '@/components/modals/DynamicModal';
import DynamicNavbar from "@/components/layout/DynamicNavbar";
import SkeletonCivilisation from "@/components/civilisations/SkeletonCivilisation";
import ListCard from "@/components/ui/ListCard";
import ListCardTree from "@/components/ui/ListCardTree";
import { plural } from "@/utils/plural";

import { showModal } from '@/utils/showModal';
import { requireLogin } from '@/utils/requireLogin';
import { civilisationModal } from '@/config/modals/civilisation';
import { religionModal } from '@/config/modals/religion';
import { navbarConfig } from '@/config/navbar';
import {
  getCivilisations
} from "@/services/api"
import GrimoireHero from "@/components/layout/GrimoireHero";

// Regroupe les civilisations dirigées (dirigeante_civilisation_id != 0) sous leur dirigeante.
// Une dirigée dont la dirigeante n'est pas visible reste à la racine.
const buildCivilisationTree = (list) => {
  const visibles = list.filter((civilisation) => civilisation.is_public || civilisation.auth);
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
          <DynamicNavbar active_id="civilisations" navigation={navbarConfig.navigation} shadow="md" />

          {loading ? (
            storageCivilisations.length === 0 ? (
              <div className="flex flex-col gap-4 w-full">
                <SkeletonCivilisation />
                <SkeletonCivilisation />
                <SkeletonCivilisation />
              </div>
            ) : (
              <CivilisationList civilisations={storageCivilisations} />
            )
          ) : civilisations.length === 0 ? (
            <p className="italic opacity-70">Aucune civilisation disponible.</p>
          ) : (
            <CivilisationList civilisations={civilisations} />
          )}

          <DynamicModal config={civilisationModal} mode="add" onSubmit={(civilisation) => { updateCivilisation(civilisation) }} />

          <DynamicModal config={religionModal} mode="add" />

        </div>
      </main>
    </>
  );
}
