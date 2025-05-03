import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'

import Home from './pages/Home/Home.jsx';
import Test from './pages/Test/Test.jsx';
import Login from './pages/Login/Login.jsx';
import Profil from './pages/Profil/Profil.jsx';

import Header from './components/Menus/Header.jsx'
import Footer from './components/Menus/Footer.jsx'

export default function App() {
  return (
    <div>
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      <Footer />
      </div>
  );
}
