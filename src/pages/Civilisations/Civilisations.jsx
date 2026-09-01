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
              <div className="flex flex-col gap-4 w-full">
                {storageCivilisations.map((civilisation) => (
                  (civilisation.is_public || civilisation.auth) ? (
                    <a key={civilisation.id} href={civilisation.link} className="civilisation-card p-4 bg-base-200 rounded-3xl shadow-md w-full">
                      <div className="flex items-center justify-start">
                        <FontAwesomeIcon icon="fas fa-flag" className="civilisation-icon mr-2" />
                        {!civilisation.is_public && <FontAwesomeIcon icon="fas fa-eye-slash" className="private-icon mr-2" />}
                        <h2 className="civilisation-title text-xl font-bold">{civilisation.title}</h2>
                      </div>
                      <p className="civilisation-description">{civilisation.description}</p>
                    </a>
                  ) : null
                ))}
              </div>
            )
          ) : civilisations.length === 0 ? (
            <p>Aucune civilisation disponible.</p>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {civilisations.map((civilisation) => (
                (civilisation.is_public || civilisation.auth) ? (
                  <a key={civilisation.id} href={civilisation.link} className="civilisation-card p-4 bg-base-200 rounded-3xl shadow-md w-full">
                    <div className="flex items-center justify-start">
                      <FontAwesomeIcon icon="fas fa-flag" className="civilisation-icon mr-2" />
                      {!civilisation.is_public && <FontAwesomeIcon icon="fas fa-eye-slash" className="private-icon mr-2" />}
                      <h2 className="civilisation-title text-xl font-bold">{civilisation.title}</h2>
                    </div>
                    <p className="civilisation-description">{civilisation.description}</p>
                  </a>
                ) : null
              ))}
            </div>
          )}

          <DynamicModal config={Config_Modal_Civilisation} mode="add" onSubmit={(civilisation) => { updateCivilisation(civilisation) }} />
          
          <DynamicModal config={Config_Modal_Religion} mode="add" />

        </div>
      </main>
    </>
  );
}
