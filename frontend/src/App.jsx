import { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'
import './App.scss'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
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

function App() {
  useEffect(() => {
    const interval = setInterval(() => {
      const token = sessionStorage.getItem('token')

      if (token) {
        fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/auth/ping', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
          },
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])
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

  return (
    <>
      <Header />
      {isEditing && <p>MODE ÉDITION ACTIF</p>}
      <div
        className={`${isError ? '' : 'page__container'} ${isEditing ? 'edit-mode' : ''}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/Editions/" element={<Editions />} />
          <Route path="/Editions/:editionId" element={<Editions />} />
          <Route path="/Photos" element={<Photos />} />
          <Route path="/Posters" element={<Posters />} />
          <Route path="/Videos" element={<Videos />} />
          <Route path="/Links" element={<Links />} />
          <Route path="/Partners" element={<Partners />} />
          <Route path="/Contact" element={<Contact />} />
          <Route
            path="/Login"
            element={<Login setIsEditing={setIsEditing} />}
          />
          <Route path="*" element={<Error />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}

export default App
