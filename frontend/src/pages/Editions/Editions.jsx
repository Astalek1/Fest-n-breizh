import './Editions.scss'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MenuEdition from '../../components/MenuEdition/MenuEdition.jsx'
import YouTubePlayer from '../../components/youTubePlayer/youTubePlayer.jsx'

function Editions({ isEditing }) {
  const { editionId } = useParams()
  const navigate = useNavigate()

  const [editions, setEditions] = useState([])
  const [editionToDelete, setEditionToDelete] = useState(null)

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

  const handleEdit = (edition) => {
    navigate(`/Editions/edit/${edition._id}`)
  }

  const handleDelete = (edition) => {
    setEditionToDelete(edition)
  }

  const confirmDeleteEdition = async () => {
    const token = sessionStorage.getItem('token')

    try {
      const response = await fetch(
        `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionToDelete._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        console.error(error)
        return
      }

      setEditions(
        editions.filter((edition) => edition._id !== editionToDelete._id),
      )

      setEditionToDelete(null)
      navigate('/Editions')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="editions">
      {/* CONTENU */}
      <div className="editions__container">
        <MenuEdition editions={editions} isEditing={isEditing} />
        {!editionId && (
          <div className="main__editions">
            <h1 className="main__editions--title">
              Présentation générale des éditions
            </h1>
            <p className="main__editions--txt">
              Bienvenue sur la page de sélection des éditions de Fest'n Breizh.
              <br />
              Les pages dédiées à chaque édition, depuis le début de l'événement
              jusqu'à aujourd'hui, sont disponibles ici. <br />
              <br /> Rendez-vous dans le menu de sélection pour accéder à la
              programmation de l'édition que vous souhaitez voir.
            </p>
            <img
              className="main__editions--img"
              src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/affiche-min%20(1).webp"
              alt="dansseurs noir et blanc"
              whidth="320"
              height="453"
            />
          </div>
        )}

        {selectedEdition && (
          <div className="edition">
            {isEditing && (
              <div className="button__edit">
                <button
                  title="modifier"
                  className="button__edit--modif"
                  onClick={() => handleEdit(selectedEdition)}
                >
                  📝
                </button>
                <button
                  title="suprimer"
                  className="button__edit--suprim"
                  onClick={() => handleDelete(selectedEdition)}
                >
                  🗑
                </button>
              </div>
            )}

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
                  width="800"
                  height="1157"
                />
              )}
              <h2 className="edition__prog">La Programmation</h2>
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
                          whidth="158"
                          height="158"
                        />
                      )}

                      {/* LOGO ancien (stocké dans media sans mediaType) */}
                      {!artist.mediaType && artist.media && (
                        <img
                          src={artist.media}
                          alt={artist.name}
                          className="edition__artist--logo"
                          whidth="158"
                          height="158"
                        />
                      )}
                      {/* Video */}
                      {artist.mediaType === 'video' && artist.media && (
                        <YouTubePlayer
                          url={artist.media}
                          title={artist.name}
                          className="edition__artist--video"
                        />
                      )}
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
                          whidth="158"
                          height="158"
                        />
                      )}

                      {/* LOGO ancien (stocké dans media sans mediaType) */}
                      {!guest.mediaType && guest.media && (
                        <img
                          src={guest.media}
                          alt={guest.name}
                          className="edition__guest--logo"
                          whidth="158"
                          height="158"
                        />
                      )}

                      {guest.mediaType === 'video' && guest.media && (
                        <YouTubePlayer
                          url={guest.media}
                          title={guest.name}
                          className="edition__guest--video"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </article>
            </div>
          </div>
        )}
      </div>

      {editionToDelete && (
        <div className="deleteEdition">
          <div className="deleteEdition__content">
            <p className="deleteEdition__content--txt">
              Voulez-vous vraiment supprimer l’édition {editionToDelete.year} ?
            </p>
            <div className="deleteEdition__content--buttons">
              <button
                className="deleteEdition__content--valid"
                type="button"
                onClick={confirmDeleteEdition}
              >
                Supprimer
              </button>

              <button
                className="deleteEdition__content--close"
                type="button"
                onClick={() => setEditionToDelete(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Editions
