import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';

import Navbar from "../../components/Navigation/Navbar";
import TitleH1 from "../../components/Sections/TitleH1";
import TitleH2 from "../../components/Sections/TitleH2";
import Modal from '../../components/Modals/Modal';

import { showModal } from '../../components/Functions/showModal';
import { ModalCivilisationAddConfig } from '../../components/Modals/ModalConfig';

import './Civilisations.css';

export default function CivilisationsPage() {

  const [civilisations, setCivilisations] = useState([]);

  useEffect(() => {
    fetch('/api/civilisations/list')
      .then((response) => response.json())
      .then((data) => {
        console.log('Civilisations fetched:', data);
        // Ajouter les liens pour redirection vers la page de détail
        const CivilisationsWithLinks = data.map(({ civilisation, members }) => ({
          ...civilisation,
          members,
          link: `/civilisation/${civilisation.id}`
        }));
        setCivilisations(CivilisationsWithLinks);
      })
      .catch((error) => {
        console.error('Error fetching civilisations:', error);
        setCivilisations([]);
      });
  }, []);

  const updateCivilisation = (data) => {
    console.log("Nouvelle civilisation ajoutée:", data);
    setCivilisations((prevCivilisations) => [...prevCivilisations, { ...data.civilisation, members: [data.member], link: `/civilisation/${data.civilisation.id}` }]);
    console.log("Civilisations mises à jour:", civilisations);
  };

  const civilisations_fonctions = [
    { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, function: () => showModal(ModalCivilisationAddConfig) }
  ];

  return (
    <>
      <Navbar active="civilisations" />
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <TitleH1 text="Civilisations" />
          <p>Listes des civilisations.</p>

          <TitleH2 text="Civilisations" fonctions={civilisations_fonctions} />
          {civilisations.length === 0 ? (
            <p>Aucune civilisation disponible.</p>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {civilisations.map((civilisation) => (
                <a key={civilisation.id} href={civilisation.link} className="civilisation-card p-4 bg-base-200 rounded-lg shadow-md w-full">
                  <div className="flex items-center justify-start">
                    <FontAwesomeIcon icon="flag" className="civilisation-icon mr-2" />
                    <h2 className="civilisation-title text-xl font-bold">{civilisation.title}</h2>
                  </div>
                  <p className="civilisation-description">{civilisation.description}</p>
                </a>
              ))}
              {/* Nombre de civilisations */}
              <div style={{ width: '100%' }}>
                {civilisations.length > 0 && (
                  <i>{civilisations.length} civilisation(s) disponible.</i>
                )}
              </div>
            </div>
          )}

          <Modal config={ModalCivilisationAddConfig} onSubmit={(civilisation) => { updateCivilisation(civilisation) }} />

        </div>
      </main>
    </>
  );
}
