import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ModalEdition from '../../components/ModalEdition/ModalEdition.jsx'
import './CreateEditionPage.scss'

function CreateEditionPage({ isEditing }) {
  const { editionId } = useParams()
  const isEditEdition = Boolean(editionId)
  const [logos, setLogos] = useState([])

  const navigate = useNavigate()
  useEffect(() => {
    if (!isEditing) {
      navigate('/Editions')
    }
  }, [isEditing, navigate])

  const [previewEdition, setPreviewEdition] = useState({
    year: '',
    description: '',
    poster: { fileId: '', url: '' },
    artists: [],
    guests: [],
  })

  const getMediaPreviewUrl = (media) => {
    if (media instanceof File) {
      return URL.createObjectURL(media)
    }

    return media || ''
  }

  const getLogoPreviewUrl = (item) => {
    if (item.media instanceof File) {
      return URL.createObjectURL(item.media)
    }

    if (item.logo) {
      return item.logo
    }

    if (typeof item.media === 'string') {
      return logos.find((logo) => logo.fileId === item.media)?.url || ''
    }

    return ''
  }

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const response = await fetch(
          'https://fnb-backend.dokku.festnbreizh.bzh/api/files/logos',
        )

        const data = await response.json()
        setLogos(data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchLogos()
  }, [])

  return (
    <main className="editionPage">
      <div className="editionPage__intro">
        {previewEdition.year && (
          <h1 className="editionPage__title">Edition {previewEdition.year}</h1>
        )}
        {previewEdition.description && (
          <p className="editionPage__txt">{previewEdition.description}</p>
        )}

        {previewEdition.poster?.url && (
          <img
            className="editionPage__img"
            src={previewEdition.poster.url}
            alt={`Edition ${previewEdition.year}`}
          />
        )}
        <p className="editionPage__prog">La Programmation</p>
      </div>

      {/*CONTENU ARTISTES*/}

      <div className="editionPage__columns">
        <article className="editionPage__content">
          {previewEdition.artists.length > 0 && (
            <>
              <h2 className="editionPage__section">Artistes</h2>
              {previewEdition.artists.map((artist) => (
                <div key={artist.tempId}>
                  <h3 className="editionPage__artist--title">{artist.name}</h3>
                  <p className="editionPage__artist--txt">
                    {artist.description}
                  </p>
                  <div className="editionPage__artist--media">
                    {/* IMAGE */}
                    {artist.mediaType === 'image' && (
                      <img
                        src={getMediaPreviewUrl(artist.media)}
                        alt={artist.name}
                        className="editionPage__artist--img"
                      />
                    )}

                    {/* LOGO (nouveau) */}
                    {artist.mediaType === 'logo' &&
                      getLogoPreviewUrl(artist) && (
                        <img
                          src={getLogoPreviewUrl(artist)}
                          alt={artist.name}
                          className="modalEdition__media--logo"
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
                          className="editionPage__artist--video"
                        />
                      ) : (
                        <video controls className="editionPage__artist--video">
                          <source src={artist.media} />
                        </video>
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </article>

        {/*CONTENU INVITES*/}

        <article className="editionPage__content">
          {previewEdition.guests.length > 0 && (
            <>
              <h2 className="editionPage__section">Invités</h2>
              {previewEdition.guests.map((guest) => (
                <div key={guest.tempId}>
                  <h3 className="editionPage__guest--title">{guest.name}</h3>
                  <p className="editionPage__guest--txt">{guest.description}</p>
                  <div className="editionPage__guest--media">
                    {/* IMAGE */}
                    {guest.mediaType === 'image' && (
                      <img
                        src={getMediaPreviewUrl(guest.media)}
                        alt={guest.name}
                        className="editionPage__guest--img"
                      />
                    )}

                    {guest.mediaType === 'logo' && getLogoPreviewUrl(guest) && (
                      <img
                        src={getLogoPreviewUrl(guest)}
                        alt={guest.name}
                        className="modalEdition__media--logo"
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
                          className="editionPage__guest--video"
                        />
                      ) : (
                        <video controls className="editionPage__guest--video">
                          <source src={guest.media} />
                        </video>
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </article>
      </div>

      <ModalEdition
        editionId={editionId}
        isEditEdition={isEditEdition}
        onPreviewChange={setPreviewEdition}
        onCancel={() => navigate('/Editions')}
      />
    </main>
  )
}

export default CreateEditionPage
