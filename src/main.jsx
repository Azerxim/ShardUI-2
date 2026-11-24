import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import '@/main.css'
import App from '@/App'
import { installMapEditorAuth } from '@/services/mapEditor'
import { installerPwa } from '@/services/pwa'

import { library } from '@fortawesome/fontawesome-svg-core'
// Icônes citées dans le code (npm run icons) ; les packs complets se chargent à la demande (DynamicIcon, IconPicker)
import icons from '@/config/fontawesome.icons'

library.add(...icons)

// Répond aux demandes de connexion de l'éditeur de carte ouvert depuis cet onglet
installMapEditorAuth()

// Site installable et fiches déjà vues lisibles hors ligne (public/sw.js)
installerPwa()

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <Router>
    <App />
  </Router>,
  // </StrictMode>,
)
