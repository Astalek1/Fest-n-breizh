import './Editions.scss'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Editions() {
  const { editionId } = useParams()
  const navigate = useNavigate()

  const [editions, setEditions] = useState([])

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/editions')
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.year - b.year)
        setEditions(sorted)
      })
      .catch((err) => console.error(err))
  }, [])

  const selectedEdition = editions.find((e) => e._id === editionId)

  return (
    <div className="editions">
      {/* MENU DYNAMIQUE */}

      <div className="editions__menu">
        {editions.map((edition) => (
          <button
            className="editions__button"
            key={edition._id}
            onClick={() => navigate(`/Editions/${edition._id}`)}
          >
            {`${edition.title} ${edition.year}`}
          </button>
        ))}
      </div>

      {/* CONTENU */}
      <div className="editions__content">
        {!editionId && <p>Présentation générale des éditions</p>}

        {selectedEdition && (
          <div className="edition">
            <h2 className="edition__title">
              {`${selectedEdition.title} ${selectedEdition.year}`}
            </h2>
            <p className="edition__txt">{selectedEdition.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
export default Editions
