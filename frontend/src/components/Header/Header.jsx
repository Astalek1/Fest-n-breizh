import './Header.scss'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Header({ isEditing }) {
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
          <Link
            className={`Header__link ${isEditing ? 'disabled' : ''}`}
            to="/"
          >
            Accueil
          </Link>
          <Link
            className={`Header__link about ${isEditing ? 'disabled' : ''}`}
            to="/About"
          >
            A-propos
          </Link>

          <div className="Header__dropdown">
            <span
              className={`Header__span ${isEditing ? 'disabled' : ''}`}
              onClick={toggleDropdown}
            >
              Galerie
            </span>
            <div className={`Header__dropdown--content ${open ? 'show' : ''}`}>
              <Link
                className={`Header__link ${isEditing ? 'disabled' : ''}`}
                to="/Posters"
                onClick={() => setOpen(false)}
              >
                Affiches
              </Link>
              <Link
                className={`Header__link ${isEditing ? 'disabled' : ''}`}
                to="/photos"
                onClick={() => setOpen(false)}
              >
                Photos
              </Link>
            </div>
          </div>
          <Link
            className={`Header__link ${isEditing ? 'disabled' : ''}`}
            to="/Editions"
          >
            Les Editions
          </Link>
          <Link
            className={`Header__link ${isEditing ? 'disabled' : ''}`}
            to="/Videos"
          >
            Nos Vidéos
          </Link>
          <Link
            className={`Header__link ${isEditing ? 'disabled' : ''}`}
            to="/Links"
          >
            Nos Réseaux
          </Link>
          <Link
            className={`Header__link ${isEditing ? 'disabled' : ''}`}
            to="/Partners"
          >
            Nos Partenaires
          </Link>
        </nav>
      </div>
    </header>
  )
}
export default Header
