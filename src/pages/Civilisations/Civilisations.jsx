import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';
import { checkMemberAuth } from "../../services/authorisation";

import Navbar from "../../components/Navigation/Navbar";
import DynamicModal from '../../components/Modals/DynamicModal';
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";
import SkeletonCivilisation from "../../components/Objects/SkeletonCivilisation";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';
import { Config_Modal_Religion } from '../../components/Modals/Config_Modal_Religion';
import { Config_RP_Navbar } from '../../components/Navigation/Config_RP_Navbar';
import {
  getCivilisations
} from "../../services/api"
import GrimoireHero from "../../components/Layouts/GrimoireHero";

// Regroupe les civilisations dirigees (dirigeante_civilisation_id != 0)
// sous la civilisation dont l'id correspond.
const buildCivilisationTree = (list) => {
  const visibles = list.filter((civilisation) => civilisation.is_public || civilisation.auth);
  const parIdentifiant = new Map(visibles.map((civilisation) => [civilisation.id, civilisation]));

  const racines = [];
  const dirigees = new Map();

  visibles.forEach((civilisation) => {
    const dirigeanteId = civilisation.dirigeante_civilisation_id;
    // Rattachee a une dirigeante visible : on l'imbrique. Sinon elle reste a la racine.
    if (dirigeanteId && dirigeanteId !== civilisation.id && parIdentifiant.has(dirigeanteId)) {
      dirigees.set(dirigeanteId, [...(dirigees.get(dirigeanteId) || []), civilisation]);
    } else {
      racines.push(civilisation);
    }
  });

  const result = racines.map((civilisation) => ({
    ...civilisation,
    dirigees: dirigees.get(civilisation.id) || [],
  }));
  // console.log(result);
  return result;
};

const CivilisationCard = ({ civilisation, dirigee = false }) => (
  <a href={civilisation.link} className="civilisation-card p-4 bg-base-200 rounded-3xl shadow-md w-full">
    <div className="flex items-center justify-start">
      <FontAwesomeIcon icon={dirigee ? "fas fa-flag-checkered" : "fas fa-flag"} className="civilisation-icon mr-2" />
      {!civilisation.is_public && <FontAwesomeIcon icon="fas fa-eye-slash" className="private-icon mr-2" />}
      <h2 className={`civilisation-title font-bold ${dirigee ? "text-lg" : "text-xl"}`}>{civilisation.title}</h2>
    </div>
    <p className="civilisation-description">{civilisation.description}</p>
  </a>
);

const CivilisationList = ({ civilisations }) => (
  <div className="flex flex-col gap-4 w-full">
    {buildCivilisationTree(civilisations).map((civilisation) => (
      <div key={civilisation.id} className="flex flex-col gap-2 w-full">
        <CivilisationCard civilisation={civilisation} />
        {civilisation.dirigees.length > 0 && (
          <div className="flex flex-col gap-2 ml-4 pl-6 border-l-2 border-base-300">
            {civilisation.dirigees.map((sousCivilisation) => (
              <CivilisationCard key={sousCivilisation.id} civilisation={sousCivilisation} dirigee />
            ))}
          </div>
        )}
      </div>
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
        const CivilisationsWithLinks = data.map(({ civilisation, members }) => ({
          ...civilisation,
          members,
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
    setCivilisations((prevCivilisations) => [...prevCivilisations, { ...data.civilisation, members: [data.member], link: `/civilisation/${data.civilisation.id}` }]);
    setStorageCivilisations((prevStorageCivilisations) => [...prevStorageCivilisations, { ...data.civilisation, members: [data.member], link: `/civilisation/${data.civilisation.id}` }]);
    localStorage.setItem('civilisations', JSON.stringify([...storageCivilisations, { ...data.civilisation, members: [data.member], link: `/civilisation/${data.civilisation.id}` }]));
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
                <button onClick={() => showModal(Config_Modal_Civilisation, "add")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Civilisation" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                  <span className="flex">Civilisation</span>
                  <FontAwesomeIcon icon="fas fa-plus" />
                </button>
                <button onClick={() => showModal(Config_Modal_Religion, "add")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Religion" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                  <span className="flex">Religion</span>
                  <FontAwesomeIcon icon="fas fa-plus" />
                </button>
              </div>
            }
          />
          <DynamicNavbar active_id="civilisations" navigation={Config_RP_Navbar.navigation} shadow="md" />

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
            <p>Aucune civilisation disponible.</p>
          ) : (
            <CivilisationList civilisations={civilisations} />
          )}

          <DynamicModal config={Config_Modal_Civilisation} mode="add" onSubmit={(civilisation) => { updateCivilisation(civilisation) }} />
          
          <DynamicModal config={Config_Modal_Religion} mode="add" />

        </div>
      </main>
    </>
  );
}
