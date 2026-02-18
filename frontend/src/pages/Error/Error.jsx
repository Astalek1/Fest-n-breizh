import './Error.scss'
import { Link } from 'react-router-dom'

function Error() {
  return (
    <div className="error">
      <h2 className="error__title">404</h2>
      <p className="error__txt">site inaccessible</p>
      <Link className="error__link" to="/">
        Retour au site
      </Link>
    </div>
  )
}

export default Error
