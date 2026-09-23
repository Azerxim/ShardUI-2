import { Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css'

import NotFoundPage from '@/pages/not-found/NotFoundPage';
import LaunchHomePage from '@/pages/home/LaunchHomePage';
import CodexPageLaunch from '@/pages/codex/CodexPageLaunch';

import FooterLaunch from '@/components/layout/FooterLaunch';
import { RouteTitle } from '@/utils/pageTitle';

export default function App() {
  return (
    <div className='mx-auto pt-20 min-h-screen flex flex-col'>
      <main className='flex-1'>
        <RouteTitle />
        <Routes>
          <Route path="/" element={<LaunchHomePage />} />
          
          <Route path="/codex" element={<CodexPageLaunch />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* <Footer /> */}
      <FooterLaunch />
    </div>
  );
}
