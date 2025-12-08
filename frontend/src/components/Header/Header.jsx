import './Header.scss'
import { Link } from 'react-router-dom'

function Header() {
  return (
    <header>
      <div className="Header">
        <img
          className="Header__img"
          src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/logo-Blanc.png?updatedAt=1764672114013"
          alt="Logo Kasa"
        />

        <nav className="Header__nav">
          <Link className="Header__link" to="/">
            Accueil
          </Link>
          <Link className="Header__link" to="/About">
            A-propos
          </Link>

          <div className="Header__dropdown">
            <span className="Header__link">Galerie</span>
            <div className="Header__dropdown-content">
              <Link className="Header__link" to="/Gallery/photos">
                Photos
              </Link>
              <Link className="Header__link" to="/Gallery/affiches">
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
