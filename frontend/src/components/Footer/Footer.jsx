import { useEffect, useState } from 'react'
import './Footer.scss'
import { Link } from 'react-router-dom'

function Footer({ isEditing }) {
  const [visits, setVisits] = useState(null)

  useEffect(() => {
    const apiUrl = 'https://fnb-backend.dokku.festnbreizh.bzh/api/visits'

    const updateVisits = async () => {
      try {
        // Première visite de la session
        if (!sessionStorage.getItem('festnbreizh_visit')) {
          const response = await fetch(apiUrl, {
            method: 'POST',
          })

          const data = await response.json()

          setVisits(data.count)
          sessionStorage.setItem('festnbreizh_visit', 'true')
        } else {
          // Session déjà comptabilisée : simple lecture
          const response = await fetch(apiUrl)
          const data = await response.json()

          setVisits(data.count)
        }
      } catch (error) {
        console.error('Erreur compteur de visites :', error)
      }
    }

    updateVisits()

    // Actualisation automatique du compteur toutes les 10 secondes
    const interval = setInterval(async () => {
      try {
        const response = await fetch(apiUrl)
        const data = await response.json()

        setVisits(data.count)
      } catch (error) {
        console.error('Erreur actualisation compteur :', error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])
  return (
    <footer>
      <div className="Footer">
        <div className="Footer__txt">
          <h2 className="Footer__copyright">
            Fest'n Breizh - 2026 - tous droits réservés
          </h2>
          {visits !== null && (
            <p className="Footer__visits">
              Nombre de visites :{' '}
              <span className="Footer__visits--count">{visits}</span>
            </p>
          )}
          <div className={`Footer__infos ${isEditing ? 'edit-mode' : ''}`}>
            <Link className="Footer__contact" to="/Contact">
              Contact
            </Link>
            <p className="Footer__contact--mail">contact@festnbreizh.bzh</p>
            <a
              className="Footer__portfolio"
              target="_blank"
              href="https://portfolio.kg-interactive.workers.dev"
              rel="noopener noreferrer"
            >
              <span>Par Kévin Goujon</span>
            </a>

            <Link className="Footer__login" to="/Login">
              Connexion
            </Link>
          </div>
        </div>
        <div className={`Footer__logo ${isEditing ? 'edit-mode' : ''}`}>
          <a
            target="_blank"
            href="https://www.facebook.com/people/Festn-Bzh/100067739030441/?locale=fr_FR"
            rel="noopener noreferrer"
          >
            <img
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/facebook-blanc.webp"
              alt="Logo Facebook"
              width="48"
              height="48"
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
              width="48"
              height="48"
              className="Footer__lien--logo "
            ></img>
          </a>

          <a
            target="_blank"
            href="https://www.instagram.com/festnbreizh/"
            rel="noopener noreferrer"
          >
            <img
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/Tiktok%20fond%20blanc.webp"
              alt="Logo TikTok"
              width="48"
              height="48"
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
              width="48"
              height="48"
              className="Footer__lien--logo Footer__lien--youtube"
            ></img>
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
