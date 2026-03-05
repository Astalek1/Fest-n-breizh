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
            <p className="main__editions--txt">
              Bienvenue sur la page de sélection des éditions de Fest'n Breizh.
              <br />
              Les pages dédiées à chaque édition, depuis le début de l'événement
              jusqu'à aujourd'hui, sont disponibles ici. <br /> Rendez-vous dans
              le menu de sélection pour accéder à la programmation de l'édition
              que vous souhaitez voir.
            </p>
            <img
              className="main__editions--img"
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/affiche-min.webp"
              alt="dansseurs noir et blanc"
            />
          </div>
        )}

        {selectedEdition && (
          <div className="edition">
            <div className="edition__intro">
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
              <p className="edition__prog">La Programmation</p>
            </div>
            <div className="edition__columns">
              {/*CONTENU ARTISTES*/}
              <article className="edition__content">
                <h2 className="edition__section">les Artistes</h2>
                {selectedEdition.artists?.map((artist) => (
                  <div key={artist._id} className="edition__artist">
                    <h3 className="edition__artist--title">{artist.name}</h3>
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
              {/*CONTENU INVITES*/}
              <article className="edition__content">
                <h2 className="edition__section">les Invités</h2>
                {selectedEdition.guests?.map((guest) => (
                  <div key={guest._id} className="edition__guest">
                    <h3 className="edition__guest--title">{guest.name}</h3>
                    <p className="edition__guest--txt">{guest.description}</p>
                    <div className="edition__guest--media">
                      {/* IMAGE */}
                      {guest.mediaType === 'image' && (
                        <img
                          src={guest.media}
                          alt={guest.name}
                          className="edition__guest--img"
                        />
                      )}

                      {/* LOGO (nouveau) */}
                      {guest.mediaType === 'logo' && (
                        <img
                          src={guest.logo}
                          alt={guest.name}
                          className="edition__guest--logo"
                        />
                      )}

                      {/* LOGO ancien (stocké dans media sans mediaType) */}
                      {!guest.mediaType && guest.media && (
                        <img
                          src={guest.media}
                          alt={guest.name}
                          className="edition__guest--logo"
                        />
                      )}

                      {guest.mediaType === 'video' &&
                        guest.media &&
                        (guest.media.includes('youtube') ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${new URL(
                              guest.media,
                            ).searchParams.get('v')}`}
                            title={guest.name}
                            allowFullScreen
                            className="edition__guest--video"
                          />
                        ) : (
                          <video controls className="edition__guest--video">
                            <source src={guest.media} />
                          </video>
                        ))}
                    </div>
                  </div>
                ))}
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default Editions
