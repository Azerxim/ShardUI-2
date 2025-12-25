import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css'

import HomePage from './pages/Home/Home';
import TestPage from './pages/Test/Test';
import LoginPage from './pages/User/Login';
import RegisterPage from './pages/User/Register';
import ProfilPage from './pages/User/Profil';
import BibliothequePage from './pages/Bibliotheque/Bibliotheque';
import JournalDetailPage from './pages/Bibliotheque/JournalDetail';

import Footer from './components/Layouts/Footer'

export default function App() {
  return (
    <div className='mx-auto py-16'>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/bibliotheque" element={<BibliothequePage />} />
        <Route path="/bibliotheque/journal/:id" element={<JournalDetailPage />} />
        <Route path="/bibliotheque/journal" element={<Navigate to="/bibliotheque" replace />} />
      </Routes>
      {/* <Footer /> */}
    </div>
  );
}
