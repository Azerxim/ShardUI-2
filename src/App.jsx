import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css'

import HomePage from './pages/Home/Home';
import Home_Classique from './pages/Home/Home_Classique';
import Home_Innovante from './pages/Home/Home_Innovante';
import Home_Creative from './pages/Home/Home_Creative';
import LoginPage from './pages/Users/Login';
import RegisterPage from './pages/Users/Register';
import ProfilPage from './pages/Users/Profil';
import UserProfilPage from './pages/Users/UserProfil';
import AdminProfilPage from './pages/Users/AdminProfil';
import UsersPage from './pages/Users/Users';
import BibliothequePage from './pages/Bibliotheque/Bibliotheque';
import JournalDetailPage from './pages/Bibliotheque/JournalDetail';
import LivreDetailPage from './pages/Bibliotheque/LivreDetail';
import CivilisationsPage from './pages/Civilisations/Civilisations';
import CivilisationPage from './pages/Civilisations/Civilisation';
import ReglesPage from './pages/Regles/Regles';
import NotFoundPage from './pages/NotFound/NotFound';

import Footer from './components/Layouts/Footer'

export default function App() {
  return (
    <div className='mx-auto pt-20 min-h-screen flex flex-col'>
      <main className='flex-1'>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Aperçu temporaire des propositions de homepage */}
          <Route path="/home-classique" element={<Home_Classique />} />
          <Route path="/home-innovante" element={<Home_Innovante />} />
          <Route path="/home-creative" element={<Home_Creative />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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

          <Route path="/regles" element={<ReglesPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
