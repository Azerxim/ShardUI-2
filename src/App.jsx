import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'

import HomePage from './pages/Home/Home.jsx';
import TestPage from './pages/Test/Test.jsx';
import LoginPage from './pages/Login/Login.jsx';
import ProfilPage from './pages/Profil/Profil.jsx';

import Header from './components/Menus/Header.jsx'
import Footer from './components/Menus/Footer.jsx'
import ServerEtat from './components/Base/ServerEtat.jsx';

export default function App() {
  return (
    <div>
      <Header />
      <section className="container mx-auto px-4 py-2">
        <ServerEtat />
      </section>
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
