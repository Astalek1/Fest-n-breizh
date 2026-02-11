import './Footer.scss'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer>
      <div className="Footer">
        <img
          className="Footer__img"
          src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/logo-Blanc.webp"
          alt="Logo Fest'n Breizh"
        />

        <div className="Footer__txt">
          <h2 className="Footer__copyright">Copyright Fest'n Breizh 2026</h2>
          <div className="Footer__bottom">
            <a
              className="Footer__portfolio"
              target="_blank"
              href="https://astalek1.github.io/portfolio/"
              rel="noopener noreferrer"
            >
              <span>By Kévin Goujon</span>
            </a>
            <Link className="Footer__login" to="/Login">
              Connexion
            </Link>
          </div>
        </div>
        <div className="Footer__logo">
          <a
            target="_blank"
            href="https://www.facebook.com/people/Festn-Bzh/100067739030441/?locale=fr_FR"
            rel="noopener noreferrer"
          >
            <img
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/facebook-blanc.webp"
              alt="Logo Facebook"
              className="Footer__lien--logo"
            ></img>
          </a>

          <a
            target="_blank"
            href="https://www.instagram.com/festnbreizh/"
            rel="noopener noreferrer"
          >
            <img
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/instagrame-blanc.webp"
              alt="Logo Instagram"
              className="Footer__lien--logo "
            ></img>
          </a>

          <a
            target="_blank"
            href="https://www.youtube.com/@festnbreizh2300/featured"
            rel="noopener noreferrer"
          >
            <img
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/youtube-rond-blanc%201.webp"
              alt="Logo Youtube"
              className="Footer__lien--logo Footer__lien--youtube"
            ></img>
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
