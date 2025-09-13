import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'

import HomePage from './pages/Home/Home.jsx';
import TestPage from './pages/Test/Test.jsx';
import LoginPage from './pages/Login/Login.jsx';
import ProfilPage from './pages/Profil/Profil.jsx';

import Header from './components/Menus/Header.jsx'
import Footer from './components/Menus/Footer.jsx'

export default function App() {
  return (
    <div>
      <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      <Footer />
      </div>
  );
}
