import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';
import { checkMemberAuth } from "../../services/authorisation";

import Navbar from "../../components/Navigation/Navbar";
import DynamicModal from '../../components/Modals/DynamicModal';
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";
import SkeletonCivilisation from "../../components/Objects/SkeletonCivilisation";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Religion } from '../../components/Modals/Config_Modal_Religion';
import { Config_RP_Navbar } from '../../components/Navigation/Config_RP_Navbar';
import {
  getReligions
} from "../../services/api"
import GrimoireHero from "../../components/Layouts/GrimoireHero";

export default function ReligionsPage() {


  const [religions, setReligions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageReligions, setStorageReligions] = useState(JSON.parse(localStorage.getItem('religions')) || []);

  useEffect(() => {
    getReligions()
      .then((data) => {
        // console.log('Religions fetched:', data);
        // Ajouter les liens pour redirection vers la page de détail
        const ReligionsWithLinks = data.map(({ religion, members }) => ({
          ...religion,
          members,
          auth: checkMemberAuth(members ? members : []),
          link: `/religion/${religion.id}`
        }));
        setReligions(ReligionsWithLinks);
        setStorageReligions(ReligionsWithLinks);
        localStorage.setItem('religions', JSON.stringify(ReligionsWithLinks));
      })
      .catch((error) => {
        console.error('Error fetching religions:', error);
        setReligions([]);
        setStorageReligions([]);
        localStorage.removeItem('religions');
      });
  }, []);

  const updateReligion = (data) => {
    // console.log("Nouvelle religion ajoutée:", data);
    setReligions((prevReligions) => [...prevReligions, { ...data.religion, members: [data.member], link: `/religion/${data.religion.id}` }]);
    setStorageReligions((prevStorageReligions) => [...prevStorageReligions, { ...data.religion, members: [data.member], link: `/religion/${data.religion.id}` }]);
    localStorage.setItem('religions', JSON.stringify([...storageReligions, { ...data.religion, members: [data.member], link: `/religion/${data.religion.id}` }]));
    // console.log("Religions mises à jour:", religions);
  };

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
                <button onClick={() => showModal(Config_Modal_Religion, "add")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Religion" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                  <span className="flex">Religion</span>
                  <FontAwesomeIcon icon="fas fa-plus" />
                </button>
              </div>
            }
          />
          <DynamicNavbar active_id="religions" navigation={Config_RP_Navbar.navigation} shadow="md" />

          {loading ? (
            storageReligions.length === 0 ? (
              <div className="flex flex-col gap-4 w-full">
                <SkeletonCivilisation />
                <SkeletonCivilisation />
                <SkeletonCivilisation />
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
              {storageReligions.map((religion) => (
                <a key={religion.id} href={religion.link} className="religion-card p-4 bg-base-200 rounded-3xl shadow-md w-full">
                  <div className="flex items-center justify-start">
                    <FontAwesomeIcon icon="fa-solid fa-place-of-worship" className="religion-icon mr-2" />
                    <h2 className="religion-title text-xl font-bold">{religion.title}</h2>
                  </div>
                  <p className="religion-description">{religion.description}</p>
                </a>
              ))}
            </div>
            )
          ) : religions.length === 0 ? (
            <p>Aucune religion disponible.</p>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {religions.map((religion) => (
                <a key={religion.id} href={religion.link} className="religion-card p-4 bg-base-200 rounded-3xl shadow-md w-full">
                  <div className="flex items-center justify-start">
                    <FontAwesomeIcon icon="fa-solid fa-place-of-worship" className="religion-icon mr-2" />
                    <h2 className="religion-title text-xl font-bold">{religion.title}</h2>
                  </div>
                  <p className="religion-description">{religion.description}</p>
                </a>
              ))}
            </div>
          )}

          <DynamicModal config={Config_Modal_Religion} mode="add" onSubmit={(religion) => { updateReligion(religion) }} />

        </div>
      </main>
    </>
  );
}
