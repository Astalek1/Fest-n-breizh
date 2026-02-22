import './Error.scss'
import { Link } from 'react-router-dom'

function Error() {
  return (
    <div className="error">
      <div className="error__container">
        <h2 className="error__title">404</h2>
        <p className="error__txt">site inaccessible</p>
        <Link className="error__link" to="/">
          Retour au site
        </Link>
      </div>
      <img
        className="error__img--center"
        src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/musiciennes1.webp"
        alt="musiciennes"
      />

      <img
        className="error__img--left"
        src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/groupe%20gauche.webp?updatedAt=1771707885390"
        alt="dansseurs"
      />

      <img
        className="error__img--right"
        src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/groupe%20droit.webp?updatedAt=1771707885289"
        alt="dansseurs"
      />
    </div>
  )
}

export default Error
