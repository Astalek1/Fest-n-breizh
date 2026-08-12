import { useState, useEffect, lazy, Suspense } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'
import './App.scss'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import PingManager from './components/PingManager/pingManager.jsx'

const Home = lazy(() => import('./pages/Home/Home.jsx'))
const About = lazy(() => import('./pages/About/About.jsx'))
const Editions = lazy(() => import('./pages/Editions/Editions.jsx'))
const Photos = lazy(() => import('./pages/Photos/Photos.jsx'))
const Posters = lazy(() => import('./pages/Posters/Posters.jsx'))
const Videos = lazy(() => import('./pages/Videos/Videos.jsx'))
const Links = lazy(() => import('./pages/Links/Links.jsx'))
const Partners = lazy(() => import('./pages/Partners/Partners.jsx'))
const Contact = lazy(() => import('./pages/Contact/Contact.jsx'))
const Login = lazy(() => import('./pages/Login/Login.jsx'))
const Error = lazy(() => import('./pages/Error/Error.jsx'))
const CreateEditionPage = lazy(
  () => import('./pages/CreateEditionPage/CreateEditionPage.jsx'),
)

function App() {
  const location = useLocation()

  const knownPaths = [
    '/',
    '/About',
    '/Editions',
    '/photos',
    '/Posters',
    '/Videos',
    '/Links',
    '/Partners',
    '/Contact',
    '/Login',
  ]
  const isError =
    !knownPaths.includes(location.pathname) &&
    !location.pathname.startsWith('/Editions/')

  const [isEditing, setIsEditing] = useState(false)
  const isEditionsPage = location.pathname.startsWith('/Editions')

  const handleLogout = () => {
    const token = sessionStorage.getItem('token')

    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .catch((error) => {
        console.error('Erreur logout :', error)
      })
      .finally(() => {
        sessionStorage.removeItem('token')
        setIsEditing(false)
      })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <div className={`site-background ${isEditing ? 'edit-mode' : ''}`}></div>
      <Header isEditing={isEditing} />
      <div className="edition__mode">
        {isEditing && (
          <>
            <p className="edition__mode--txt">MODE ÉDITION ACTIF</p>
            <button className="edition__mode--btn" onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        )}
      </div>
      <PingManager isEditing={isEditing} />
      <div
        className={`
    ${isError ? '' : 'page__container'}
    ${isEditionsPage ? 'page__container--edition' : ''}
    ${isEditing ? 'edit-mode' : ''}
  `}
      >
        <Suspense fallback={<div>Chargement...</div>}>
          <Routes>
            <Route path="/" element={<Home isEditing={isEditing} />} />
            <Route path="/About" element={<About />} />

            <Route
              path="/Editions/"
              element={<Editions isEditing={isEditing} />}
            />

            <Route
              path="/Editions/create"
              element={<CreateEditionPage isEditing={isEditing} />}
            />

            <Route
              path="/Editions/edit/:editionId"
              element={<CreateEditionPage isEditing={isEditing} />}
            />
            <Route
              path="/Editions/:editionId"
              element={<Editions isEditing={isEditing} />}
            />

            <Route path="/Photos" element={<Photos isEditing={isEditing} />} />
            <Route
              path="/Posters"
              element={<Posters isEditing={isEditing} />}
            />
            <Route path="/Videos" element={<Videos isEditing={isEditing} />} />
            <Route path="/Links" element={<Links isEditing={isEditing} />} />
            <Route
              path="/Partners"
              element={<Partners isEditing={isEditing} />}
            />
            <Route path="/Contact" element={<Contact />} />
            <Route
              path="/Login"
              element={<Login setIsEditing={setIsEditing} />}
            />
            <Route path="*" element={<Error />} />
          </Routes>
        </Suspense>
      </div>
      <Footer isEditing={isEditing} />
      <div />
    </>
  )
}

export default App
