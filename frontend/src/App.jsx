import './App.scss'
import { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'

import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import PingManager from './components/PingManager/pingManager.jsx'
import Home from './pages/Home/Home.jsx'
import About from './pages/About/About.jsx'
import Editions from './pages/Editions/Editions.jsx'
import Photos from './pages/Photos/Photos.jsx'
import Posters from './pages/Posters/Posters.jsx'
import Videos from './pages/Videos/Videos.jsx'
import Links from './pages/Links/Links.jsx'
import Partners from './pages/Partners/Partners.jsx'
import Contact from './pages/Contact/Contact.jsx'
import Login from './pages/Login/Login.jsx'
import Error from './pages/Error/Error.jsx'
import CreateEditionPage from './pages/CreateEditionPage/CreateEditionPage.jsx'

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
          <Route path="/Posters" element={<Posters isEditing={isEditing} />} />
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
      </div>
      <Footer isEditing={isEditing} />
      <div />
    </>
  )
}

export default App
