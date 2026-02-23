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
      <div className="editions__container">
        {!editionId && <p>Présentation générale des éditions</p>}

        {selectedEdition && (
          <div className="edition">
            <h1 className="edition__title">
              {`${selectedEdition.title} ${selectedEdition.year}`}
            </h1>
            <p className="edition__txt">{selectedEdition.description}</p>

            <article className="edition__content">
              {selectedEdition.artists?.map((artist) => (
                <div key={artist._id} className="edition__artist">
                  <h2 className="edition__artist--title">{artist.name}</h2>
                  <p className="edition__artist--txt">{artist.description}</p>
                  <div className="edition__artist--media">
                    {artist.media && (
                      <img
                        src={artist.media}
                        alt={artist.name}
                        className="edition__artist--img"
                      />
                    )}

                    {!artist.media && artist.logo && (
                      <img
                        src={artist.logo}
                        alt={artist.name}
                        className="edition__artist--img"
                      />
                    )}

                    {artist.mediaType === 'video' && artist.media && (
                      <iframe
                        src={artist.media.replace('watch?v=', 'embed/')}
                        title={artist.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="edition__artist--video"
                      />
                    )}
                  </div>
                </div>
              ))}
            </article>
          </div>
        )}
      </div>
    </div>
  )
}
export default Editions
