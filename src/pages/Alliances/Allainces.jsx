import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';

import Navbar from "../../components/Navigation/Navbar";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import DynamicModal from '../../components/Modals/DynamicModal';
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Alliances } from '../../components/Modals/Config_Modal_Alliances';
import { Config_RP_Navbar } from '../../components/Navigation/Config_RP_Navbar';
import { 
  getCivilisations
} from "../../services/api"
import GrimoireHero from "../../components/Layouts/GrimoireHero";

export default function AlliancesPage() {

  const [data, setData] = useState([]);
  const [alliances, setAlliances] = useState([]);

  useEffect(() => {
    getCivilisations()
      .then((data) => {
        // console.log('Civilisations fetched:', data);
        // Ajouter les liens pour redirection vers la page de détail
        setData(data);
        setAlliances(data.alliances);
      })
      .catch((error) => {
        console.error('Error fetching civilisations:', error);
        setData([]);
        setAlliances([]);
      });
  }, []);

  const updateAlliances = (data) => {
    console.log("Nouvelle alliance ajoutée:", data);
    // setAlliances((prevAlliances) => [...prevAlliances, { ...data.civilisation, members: [data.member], link: `/civilisation/${data.civilisation.id}` }]);
    // console.log("Alliances mises à jour:", alliances);
  };

  return (
    <>
      <Navbar active="alliances" />
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <GrimoireHero
            icon="fa-solid fa-flag"
            title="Les Alliances de Tetrago"
            description="Des pactes aux coalitions, chaque alliance porte ses objectifs, ses membres et son influence : voici la carte vivante de Tetrago. Rejoignez-en une, ou forgez la vôtre."
                        topRight={
                          <div className="flex flex-col gap-2">
                            <button onClick={() => showModal(Config_Modal_Alliances, "add")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Alliance" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                              <span className="flex">Alliance</span>
                              <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                          </div>
                        }
          />
          <DynamicNavbar active_id="alliances" navigation={Config_RP_Navbar.navigation} shadow="md" />

          {alliances.length === 0 ? (
            <p>Aucune alliance disponible.</p>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {alliances.map((alliance) => (
                <a key={alliance.id} href={alliance.link} className="alliance-card p-4 bg-base-200 rounded-3xl shadow-md w-full">
                  <div className="flex items-center justify-start">
                    <FontAwesomeIcon icon="fa-solid fa-handshake" className="alliance-icon mr-2" />
                    <h2 className="alliance-title text-xl font-bold">{alliance.title}</h2>
                  </div>
                  <p className="alliance-description">{alliance.description}</p>
                </a>
              ))}
              {/* Nombre d'alliances */}
              <div style={{ width: '100%' }}>
                {alliances.length > 0 && (
                  <i>{alliances.length} alliance(s) disponible.</i>
                )}
              </div>
            </div>
          )}

          <DynamicModal config={Config_Modal_Alliances} mode="add" onSubmit={(alliance) => { updateAlliances(alliance) }} />

        </div>
      </main>
    </>
  );
}
