import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useState, useEffect } from 'react';
import { checkMemberAuth } from "../../services/authorisation";

import Navbar from "../../components/Navigation/Navbar";
import DynamicModal from '../../components/Modals/DynamicModal';
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";
import SkeletonCivilisation from "../../components/Objects/SkeletonCivilisation";
import ListCard from "../../components/Objects/ListCard";
import { plural } from "../../components/Functions/plural";

import { showModal } from '../../components/Functions/showModal';
import { requireLogin } from '../../components/Functions/requireLogin';
import { religionColor, religionIcon } from '../../components/Functions/religionColor';
import { Config_Modal_Religion } from '../../components/Modals/Config_Modal_Religion';
import { Config_RP_Navbar } from '../../components/Navigation/Config_RP_Navbar';
import {
  getReligions
} from "../../services/api"
import GrimoireHero from "../../components/Layouts/GrimoireHero";

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
                <button onClick={() => requireLogin(() => showModal(Config_Modal_Religion, "add"), "fonder une religion")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouvelle Religion" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
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
              <ReligionList religions={storageReligions} />
            )
          ) : religions.length === 0 ? (
            <p className="italic opacity-70">Aucune religion disponible.</p>
          ) : (
            <ReligionList religions={religions} />
          )}

          <DynamicModal config={Config_Modal_Religion} mode="add" onSubmit={(religion) => { updateReligion(religion) }} />

        </div>
      </main>
    </>
  );
}
