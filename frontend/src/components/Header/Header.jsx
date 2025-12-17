import './Header.scss'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Header() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.Header__dropdown')) {
        setOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setOpen(!open)
  }

  return (
    <header>
      <div className="Header">
        <img
          className="Header__img"
          src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/logo-Blanc.webp"
          alt="Logo Fest'n Breizh"
        />

        <nav className="Header__nav">
          <Link className="Header__link" to="/">
            Accueil
          </Link>
          <Link className="Header__link" to="/About">
            A-propos
          </Link>

          <div className="Header__dropdown">
            <span className="Header__span" onClick={toggleDropdown}>
              Galerie
            </span>
            <div className={`Header__dropdown--content ${open ? 'show' : ''}`}>
              <Link
                className="Header__link"
                to="/photos"
                onClick={() => setOpen(false)}
              >
                Photos
              </Link>
              <Link
                className="Header__link"
                to="/Posters"
                onClick={() => setOpen(false)}
              >
                Affiches
              </Link>
            </div>
          </div>
          <Link className="Header__link" to="/Editions">
            Les Editions
          </Link>
          <Link className="Header__link" to="/Videos">
            Nos Vidéos
          </Link>
          <Link className="Header__link" to="/Links">
            Nos Liens
          </Link>
          <Link className="Header__link" to="/Partners">
            Nos Partenaires
          </Link>
          <Link className="Header__link" to="/Contact">
            Nous Contacter
          </Link>
        </nav>
      </div>
    </header>
  )
}
export default Header
