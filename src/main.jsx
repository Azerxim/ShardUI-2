import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import '@/main.css'
import App from '@/App'
import AppLaunch from '@/AppLaunch'
import { installMapEditorAuth } from '@/services/mapEditor'

import { library } from '@fortawesome/fontawesome-svg-core'
// Icônes citées dans le code (npm run icons) ; les packs complets se chargent à la demande (DynamicIcon, IconPicker)
import icons from '@/config/fontawesome.icons'

library.add(...icons)

// Répond aux demandes de connexion de l'éditeur de carte ouvert depuis cet onglet
installMapEditorAuth()

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <Router>
    {/* <AppLaunch /> */}
    <App />
  </Router>,
  // </StrictMode>,
)
