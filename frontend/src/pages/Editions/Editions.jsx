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

  const [poster, setPoster] = useState(null)

  useEffect(() => {
    if (!selectedEdition?.poster) return

    setPoster(null) // reset quand on change d’édition

    fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters/${selectedEdition.poster}`,
    )
      .then((res) => res.json())
      .then((data) => setPoster(data))
      .catch((err) => console.error(err))
  }, [selectedEdition?.poster])

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
        {!editionId && (
          <div className="main__editions">
            <h1 className="main__editions--title">
              Présentation générale des éditions
            </h1>
            <p className="main__editions--txt">text a venir</p>
            <img
              className="main__editions--img"
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/affiche-min.webp"
              alt="dansseurs noir et blanc"
            />
          </div>
        )}

        {selectedEdition && (
          <div className="edition">
            <h1 className="edition__title">
              {`${selectedEdition.title} ${selectedEdition.year}`}
            </h1>
            <p className="edition__txt">{selectedEdition.description}</p>
            {poster && (
              <img
                className="edition__img"
                src={poster.url}
                alt={`affiche ${selectedEdition.title} ${selectedEdition.year}`}
              />
            )}

            <article className="edition__content">
              {selectedEdition.artists?.map((artist) => (
                <div key={artist._id} className="edition__artist">
                  <h2 className="edition__artist--title">{artist.name}</h2>
                  <p className="edition__artist--txt">{artist.description}</p>
                  <div className="edition__artist--media">
                    {/* IMAGE */}
                    {artist.mediaType === 'image' && (
                      <img
                        src={artist.media}
                        alt={artist.name}
                        className="edition__artist--img"
                      />
                    )}

                    {/* LOGO (nouveau) */}
                    {artist.mediaType === 'logo' && (
                      <img
                        src={artist.logo}
                        alt={artist.name}
                        className="edition__artist--logo"
                      />
                    )}

                    {/* LOGO ancien (stocké dans media sans mediaType) */}
                    {!artist.mediaType && artist.media && (
                      <img
                        src={artist.media}
                        alt={artist.name}
                        className="edition__artist--logo"
                      />
                    )}

                    {artist.mediaType === 'video' &&
                      artist.media &&
                      (artist.media.includes('youtube') ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${new URL(
                            artist.media,
                          ).searchParams.get('v')}`}
                          title={artist.name}
                          allowFullScreen
                          className="edition__artist--video"
                        />
                      ) : (
                        <video controls className="edition__artist--video">
                          <source src={artist.media} />
                        </video>
                      ))}
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
