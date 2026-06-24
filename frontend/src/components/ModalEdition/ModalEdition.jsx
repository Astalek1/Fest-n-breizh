import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ModalArtist from '../ModalArtist/ModalArtist.jsx'
import ModalGuest from '../ModalGuest/ModalGuest.jsx'
import './ModalEdition.scss'

function ModalEdition({ editionId, isEditEdition, onPreviewChange }) {
  const navigate = useNavigate()

  const [editionDraft, setEditionDraft] = useState({
    year: '',
    description: '',
    poster: null,
  })

  const [artistsDraft, setArtistsDraft] = useState([])
  const [guestsDraft, setGuestsDraft] = useState([])

  const [editingArtist, setEditingArtist] = useState(null)
  const [editingGuest, setEditingGuest] = useState(null)

  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)

  const [initialArtistIds, setInitialArtistIds] = useState([])
  const [initialGuestIds, setInitialGuestIds] = useState([])

  const [posters, setPosters] = useState([])
  const [logos, setLogos] = useState([])

  const canValidateEdition =
    String(editionDraft.year || '').trim() !== '' &&
    String(editionDraft.description || '').trim() !== '' &&
    Boolean(editionDraft.poster?.fileId) &&
    artistsDraft.length > 0

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const response = await fetch(
          'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters',
        )

        const data = await response.json()
        setPosters(data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchPosters()
  }, [])

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

  useEffect(() => {
    onPreviewChange({
      ...editionDraft,
      artists: artistsDraft,
      guests: guestsDraft,
    })
  }, [editionDraft, artistsDraft, guestsDraft, onPreviewChange])

  useEffect(() => {
    if (!isEditEdition) return

    const fetchEdition = async () => {
      try {
        const response = await fetch(
          `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionId}`,
        )

        const data = await response.json()

        let posterUrl = ''

        if (data.poster) {
          const responsePoster = await fetch(
            `https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters/${data.poster}`,
          )

          if (responsePoster.ok) {
            const posterData = await responsePoster.json()
            posterUrl = posterData.urlSmall || posterData.url || ''
          }
        }

        setEditionDraft({
          year: data.year || '',
          description: data.description || '',
          poster: data.poster
            ? {
                fileId: data.poster,
                url: posterUrl,
              }
            : null,
        })

        setArtistsDraft(
          (data.artists || []).map((artist) => ({
            ...artist,
            tempId: artist._id,
          })),
          setInitialArtistIds((data.artists || []).map((artist) => artist._id)),
        )

        setGuestsDraft(
          (data.guests || []).map((guest) => ({
            ...guest,
            tempId: guest._id,
          })),
          setInitialGuestIds((data.guests || []).map((guest) => guest._id)),
        )
      } catch (error) {
        console.error(error)
      }
    }

    fetchEdition()
  }, [editionId, isEditEdition])

  const formatEntity = (item) => ({
    ...item,
    media: item.media instanceof File ? null : item.media,
  })

  const appendFiles = (formData, artists, guests) => {
    artists.forEach((artist) => {
      if (artist.media instanceof File) {
        formData.append('artistFiles', artist.media)
      }
    })

    guests.forEach((guest) => {
      if (guest.media instanceof File) {
        formData.append('guestFiles', guest.media)
      }
    })
  }

  const addNewArtists = async (editionId, artists, token) => {
    for (const artist of artists) {
      const formData = new FormData()

      formData.append(
        'artist',
        JSON.stringify({
          name: artist.name,
          description: artist.description,
          mediaType: artist.mediaType,
          media: artist.media instanceof File ? null : artist.media,
          fileName: artist.fileName,
        }),
      )

      if (artist.media instanceof File) {
        formData.append('media', artist.media)
      }

      await fetch(
        `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionId}/artists`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )
    }
  }

  const addNewGuests = async (editionId, guests, token) => {
    for (const guest of guests) {
      const formData = new FormData()

      formData.append(
        'guest',
        JSON.stringify({
          name: guest.name,
          description: guest.description,
          mediaType: guest.mediaType,
          media: guest.media instanceof File ? null : guest.media,
          fileName: guest.fileName,
        }),
      )

      if (guest.media instanceof File) {
        formData.append('media', guest.media)
      }

      const response = await fetch(
        `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionId}/guests`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      const result = await response.json()
      console.log('add guest response', response.status, result)
    }
  }

  const deleteRemovedArtists = async (token) => {
    const currentIds = artistsDraft
      .filter((artist) => artist._id)
      .map((artist) => artist._id)

    const removedIds = initialArtistIds.filter((id) => !currentIds.includes(id))

    for (const id of removedIds) {
      await fetch(
        `https://fnb-backend.dokku.festnbreizh.bzh/api/artists/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    }
  }

  const deleteRemovedGuests = async (token) => {
    const currentIds = guestsDraft
      .filter((guest) => guest._id)
      .map((guest) => guest._id)

    const removedIds = initialGuestIds.filter((id) => !currentIds.includes(id))

    for (const id of removedIds) {
      await fetch(
        `https://fnb-backend.dokku.festnbreizh.bzh/api/guests/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    }
  }

  const handleValidateEdition = async () => {
    console.log('clic validation édition')
    console.log('canValidateEdition', canValidateEdition)
    if (!canValidateEdition) return

    try {
      const token = sessionStorage.getItem('token')
      const formData = new FormData()

      const existingArtists = artistsDraft.filter((artist) => artist._id)
      const newArtists = artistsDraft.filter((artist) => !artist._id)

      const existingGuests = guestsDraft.filter((guest) => guest._id)
      const newGuests = guestsDraft.filter((guest) => !guest._id)

      const artistsToSend = isEditEdition ? existingArtists : artistsDraft
      const guestsToSend = isEditEdition ? existingGuests : guestsDraft

      const editionData = {
        title: 'Edition',
        year: editionDraft.year,
        description: editionDraft.description,
        poster: editionDraft.poster.fileId,
        artists: artistsToSend.map(formatEntity),
        guests: guestsToSend.map(formatEntity),
      }

      formData.append('edition', JSON.stringify(editionData))
      appendFiles(formData, artistsToSend, guestsToSend)

      const response = await fetch(
        isEditEdition
          ? `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionId}`
          : 'https://fnb-backend.dokku.festnbreizh.bzh/api/editions',
        {
          method: isEditEdition ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      const result = await response.json()

      if (!response.ok) {
        console.error(result)
        return
      }

      const finalEditionId = isEditEdition ? editionId : result.edition._id

      if (isEditEdition) {
        await deleteRemovedArtists(token)
        await deleteRemovedGuests(token)
        await addNewArtists(finalEditionId, newArtists, token)
        await addNewGuests(finalEditionId, newGuests, token)
      }

      navigate(`/Editions/${finalEditionId}`)
    } catch (error) {
      console.error(error)
    }
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

  return (
    <div className="modalEdition">
      <div className="modalEdition__content">
        <h2 className="modalEdition__content--title">
          {isEditEdition ? 'Modifier l’édition' : 'Créer une nouvelle édition'}
        </h2>

        <label className="modalEdition__content--label">
          Année
          <input
            type="text"
            value={editionDraft.year}
            onChange={(e) =>
              setEditionDraft({
                ...editionDraft,
                year: e.target.value,
              })
            }
          />
        </label>

        <label className="modalEdition__content--label">
          Description
          <textarea
            value={editionDraft.description}
            onChange={(e) =>
              setEditionDraft({
                ...editionDraft,
                description: e.target.value,
              })
            }
          />
        </label>

        <label className="modalEdition__content--label">Affiche</label>

        <select
          value={editionDraft.poster?.fileId || ''}
          onChange={(e) => {
            const selectedPoster = posters.find(
              (poster) => poster._id === e.target.value,
            )

            setEditionDraft({
              ...editionDraft,
              poster: selectedPoster
                ? {
                    url: selectedPoster.urlSmall,
                    fileId: selectedPoster._id,
                  }
                : null,
            })
          }}
        >
          <option value="">Choisir une affiche</option>

          {posters.map((poster) => (
            <option key={poster._id} value={poster._id}>
              {poster.title || poster.name || 'Affiche'}
            </option>
          ))}
        </select>

        <section className="modalEdition__content--posterSection">
          {editionDraft.poster?.url && (
            <img
              className="modalEdition__content--poster"
              src={editionDraft.poster.url}
              alt="Affiche"
            />
          )}
        </section>

        <div className="modalEdition__button">
          <div className="modalEdition__button--artistcolumn">
            <button
              className="modalEdition__button--artist"
              type="button"
              title="ajouter un artiste"
              onClick={() => setIsArtistModalOpen(true)}
            >
              Ajouter un artiste
            </button>

            {isArtistModalOpen && !editingArtist && (
              <ModalArtist
                data={null}
                onClose={() => setIsArtistModalOpen(false)}
                onValidate={(artist) => {
                  setArtistsDraft([
                    ...artistsDraft,
                    { ...artist, tempId: crypto.randomUUID() },
                  ])

                  setIsArtistModalOpen(false)
                }}
              />
            )}

            {artistsDraft.map((artist) => (
              <div className="modalEdition__info" key={artist.tempId}>
                {editingArtist?.tempId === artist.tempId ? (
                  <ModalArtist
                    data={editingArtist}
                    onClose={() => {
                      setEditingArtist(null)
                      setIsArtistModalOpen(false)
                    }}
                    onValidate={(updatedArtist) => {
                      setArtistsDraft(
                        artistsDraft.map((item) =>
                          item.tempId === editingArtist.tempId
                            ? { ...updatedArtist, tempId: editingArtist.tempId }
                            : item,
                        ),
                      )

                      setEditingArtist(null)
                      setIsArtistModalOpen(false)
                    }}
                  />
                ) : (
                  <>
                    <p className="modalEdition__info--name">{artist.name}</p>
                    <p className="modalEdition__info--description">
                      {artist.description}
                    </p>

                    {artist.mediaType === 'image' && artist.media && (
                      <img
                        src={
                          artist.media instanceof File
                            ? URL.createObjectURL(artist.media)
                            : artist.media
                        }
                        alt={artist.name}
                        className="modalEdition__media--img"
                      />
                    )}

                    {artist.mediaType === 'logo' &&
                      getLogoPreviewUrl(artist) && (
                        <img
                          src={getLogoPreviewUrl(artist)}
                          alt={artist.name}
                          className="modalEdition__media--logo"
                        />
                      )}

                    {artist.mediaType === 'video' &&
                      typeof artist.media === 'string' &&
                      artist.media &&
                      (artist.media.includes('youtube') ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${new URL(
                            artist.media,
                          ).searchParams.get('v')}`}
                          title={artist.name}
                          allowFullScreen
                          className="modalEdition__media--video"
                        />
                      ) : (
                        <video controls className="modalEdition__media--video">
                          <source src={artist.media} />
                        </video>
                      ))}

                    <section className="modalEdition__button--EditSup">
                      <button
                        className="modalEdition__button--edit"
                        type="button"
                        title="modifier l'artiste"
                        onClick={() => {
                          setEditingArtist(artist)
                          setIsArtistModalOpen(true)
                        }}
                      >
                        Modifier l'artiste
                      </button>

                      <button
                        className="modalEdition__button--sup"
                        type="button"
                        title="suprimer l'artiste"
                        onClick={() =>
                          setArtistsDraft(
                            artistsDraft.filter(
                              (item) => item.tempId !== artist.tempId,
                            ),
                          )
                        }
                      >
                        Supprimer l'artiste
                      </button>
                    </section>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="modalEdition__button--guestcolumn">
            <button
              className="modalEdition__button--guest"
              type="button"
              title="ajouter un invité"
              onClick={() => setIsGuestModalOpen(true)}
            >
              Ajouter un invité
            </button>

            {isGuestModalOpen && !editingGuest && (
              <ModalGuest
                data={null}
                onClose={() => setIsGuestModalOpen(false)}
                onValidate={(guest) => {
                  setGuestsDraft([
                    ...guestsDraft,
                    { ...guest, tempId: crypto.randomUUID() },
                  ])

                  setIsGuestModalOpen(false)
                }}
              />
            )}

            {guestsDraft.map((guest) => (
              <div className="modalEdition__info" key={guest.tempId}>
                {editingGuest?.tempId === guest.tempId ? (
                  <ModalGuest
                    data={editingGuest}
                    onClose={() => {
                      setEditingGuest(null)
                      setIsGuestModalOpen(false)
                    }}
                    onValidate={(updatedGuest) => {
                      setGuestsDraft(
                        guestsDraft.map((item) =>
                          item.tempId === editingGuest.tempId
                            ? { ...updatedGuest, tempId: editingGuest.tempId }
                            : item,
                        ),
                      )

                      setEditingGuest(null)
                      setIsGuestModalOpen(false)
                    }}
                  />
                ) : (
                  <>
                    <p className="modalEdition__info--name">{guest.name}</p>
                    <p className="modalEdition__info--description">
                      {guest.description}
                    </p>

                    {guest.mediaType === 'image' && guest.media && (
                      <img
                        src={
                          guest.media instanceof File
                            ? URL.createObjectURL(guest.media)
                            : guest.media
                        }
                        alt={guest.name}
                        className="modalEdition__media--img"
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
                      typeof guest.media === 'string' &&
                      guest.media &&
                      (guest.media.includes('youtube') ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${new URL(
                            guest.media,
                          ).searchParams.get('v')}`}
                          title={guest.name}
                          allowFullScreen
                          className="modalEdition__media--video"
                        />
                      ) : (
                        <video controls className="modalEdition__media--video">
                          <source src={guest.media} />
                        </video>
                      ))}

                    <section className="modalEdition__button--EditSup">
                      <button
                        className="modalEdition__button--edit"
                        type="button"
                        title="modifier l'invité"
                        onClick={() => {
                          setEditingGuest(guest)
                          setIsGuestModalOpen(true)
                        }}
                      >
                        Modifier l'invité
                      </button>

                      <button
                        className="modalEdition__button--sup"
                        type="button"
                        title="suprimer l'invité"
                        onClick={() =>
                          setGuestsDraft(
                            guestsDraft.filter(
                              (item) => item.tempId !== guest.tempId,
                            ),
                          )
                        }
                      >
                        Supprimer l'invité
                      </button>
                    </section>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <span className="modalEdition__content--optiontionsvalidate">
          {isEditEdition
            ? 'valider/annuler modifications'
            : 'valider/annuler création'}
        </span>

        <div className="modalEdition__buttonCreate">
          <button
            className="modalEdition__buttonCreate--create"
            type="button"
            title="valider"
            disabled={!canValidateEdition}
            onClick={handleValidateEdition}
          >
            {isEditEdition ? 'Valider les modifications' : 'Créer l’édition'}
          </button>

          <button
            className="modalEdition__buttonCreate--cancel"
            type="button"
            title="annuler"
            onClick={() =>
              navigate(isEditEdition ? `/Editions/${editionId}` : '/Editions')
            }
          >
            {isEditEdition ? 'Annuler les modifications' : 'Annuler l’édition'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEdition
