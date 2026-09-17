import { Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css'

import HomePage from '@/pages/home/HomePage';
import LoginPage from '@/pages/users/LoginPage';
import RegisterPage from '@/pages/users/RegisterPage';
import ProfilPage from '@/pages/users/ProfilPage';
import UserProfilPage from '@/pages/users/UserProfilPage';
import AdminProfilPage from '@/pages/users/AdminProfilPage';
import UsersPage from '@/pages/users/UsersPage';
import OAuthCallbackPage from '@/pages/users/OAuthCallbackPage';
import BibliothequePage from '@/pages/bibliotheque/BibliothequePage';
import JournalDetailPage from '@/pages/bibliotheque/JournalDetailPage';
import LivreDetailPage from '@/pages/bibliotheque/LivreDetailPage';
import CivilisationsPage from '@/pages/civilisations/CivilisationsPage';
import CivilisationPage from '@/pages/civilisations/CivilisationPage';
import VilleDetailPage from '@/pages/civilisations/VilleDetailPage';
import QuartierDetailPage from '@/pages/civilisations/QuartierDetailPage';
import ReligionsPage from '@/pages/religions/ReligionsPage';
import ReligionPage from '@/pages/religions/ReligionPage';
import CommercesPage from '@/pages/commerces/CommercesPage';
import CommercePage from '@/pages/commerces/CommercePage';
import AlliancesPage from '@/pages/alliances/AlliancesPage';
import AlliancePage from '@/pages/alliances/AlliancePage';
import GuerresPage from '@/pages/guerres/GuerresPage';
import GuerrePage from '@/pages/guerres/GuerrePage';
import PersonnagesPage from '@/pages/personnages/PersonnagesPage';
import PersonnagePage from '@/pages/personnages/PersonnagePage';
import CodexPage from '@/pages/codex/CodexPage';
import AdminDimensionsPage from '@/pages/admin/AdminDimensionsPage';
import AdminPersonnagesPage from '@/pages/admin/AdminPersonnagesPage';
import AdminMondePage from '@/pages/admin/AdminMondePage';
import NotFoundPage from '@/pages/not-found/NotFoundPage';

import Footer from '@/components/layout/Footer'
import { RouteTitle } from '@/utils/pageTitle';

export default function App() {
  return (
    <div className='mx-auto pt-20 min-h-screen flex flex-col'>
      <main className='flex-1'>
        <RouteTitle />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/:provider/callback" element={<OAuthCallbackPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/profil/:user_id" element={<UserProfilPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:user_id" element={<AdminProfilPage />} />

          <Route path="/bibliotheque" element={<BibliothequePage />} />
          <Route path="/bibliotheque/journal/:id" element={<JournalDetailPage />} />
          <Route path="/bibliotheque/journal" element={<Navigate to="/bibliotheque" replace />} />
          <Route path="/bibliotheque/livre/:id" element={<LivreDetailPage />} />
          <Route path="/bibliotheque/livre" element={<Navigate to="/bibliotheque" replace />} />

          <Route path="/civilisations" element={<CivilisationsPage />} />
          <Route path="/civilisation" element={<Navigate to="/civilisations" replace />} />
          <Route path="/civilisation/:id" element={<CivilisationPage />} />
          <Route path="/civilisation/:civ_id/ville/:id" element={<VilleDetailPage />} />
          <Route path="/quartier/:id" element={<QuartierDetailPage />} />

          <Route path="/religions" element={<ReligionsPage />} />
          <Route path="/religion" element={<Navigate to="/religions" replace />} />
          <Route path="/religion/:id" element={<ReligionPage />} />

          <Route path="/commerces" element={<CommercesPage />} />
          <Route path="/commerce" element={<Navigate to="/commerces" replace />} />
          <Route path="/commerce/:id" element={<CommercePage />} />

          <Route path="/alliances" element={<AlliancesPage />} />
          <Route path="/alliance" element={<Navigate to="/alliances" replace />} />
          <Route path="/alliance/:id" element={<AlliancePage />} />

          <Route path="/guerres" element={<GuerresPage />} />
          <Route path="/guerre" element={<Navigate to="/guerres" replace />} />
          <Route path="/guerre/:id" element={<GuerrePage />} />

          <Route path="/personnages" element={<PersonnagesPage />} />
          <Route path="/personnage" element={<Navigate to="/personnages" replace />} />
          <Route path="/personnage/:id" element={<PersonnagePage />} />

          <Route path="/codex" element={<CodexPage />} />

          <Route path="/admin" element={<Navigate to="/admin/dimensions" replace />} />
          <Route path="/admin/dimensions" element={<AdminDimensionsPage />} />
          <Route path="/admin/personnages" element={<AdminPersonnagesPage />} />
          <Route path="/admin/monde" element={<AdminMondePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
