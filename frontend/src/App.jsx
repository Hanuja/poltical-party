import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import './i18n'
import './styles/global.css'
import './styles/animations.css'
import './styles/responsive.css'
import './styles/components.css'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
