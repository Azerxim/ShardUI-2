import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';

import Navbar from "../../components/Navigation/Navbar";
import TitleH1 from "../../components/Sections/TitleH1";

import './Civilisations.css';

export default function CivilisationsPage() {

  const [civilisations, setCivilisations] = useState([]);

  useEffect(() => {
      fetch('/api/civilisations/read/')
          .then((response) => response.json())
          .then((data) => {
              console.log('Civilisations fetched:', data);
              // Ajouter les liens pour redirection vers la page de détail
              const CivilisationsWithLinks = data.map(civilisation => ({
                  ...civilisation,
                  link: `/civilisation/${civilisation.id}`
              }));
              setCivilisations(CivilisationsWithLinks);
          })
          .catch((error) => {
              console.error('Error fetching civilisations:', error);
              setCivilisations([]);
          });
  }, []);

  return (
    <>
      <Navbar active="civilisations" />
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <TitleH1 text="Civilisations" />
          <p>Listes des civilisations.</p>

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
                <div style={{ width: '100%'}}>
                    {civilisations.length > 0 && (
                        <i>{civilisations.length} civilisation(s) disponible.</i>
                    )}
                </div>
              </div>
          )}
        </div>
      </main>
    </>
  );
}
