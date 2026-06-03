import { useState, useEffect } from 'react'
import ModalArtist from '../ModalArtist/ModalArtist.jsx'
import ModalGuest from '../ModalGuest/ModalGuest.jsx'
import './ModalEdition.scss'

function ModalEdition({ editionId, isEditEdition, onPreviewChange }) {
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

  const posters = []
  const canValidateEdition = artistsDraft.length > 0

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

        setEditionDraft({
          year: data.year || '',
          description: data.description || '',
          poster: data.poster
            ? {
                fileId: data.poster,
                url: '',
              }
            : null,
        })

        setArtistsDraft(
          (data.artists || []).map((artist) => ({
            ...artist,
            tempId: artist._id,
          })),
        )

        setGuestsDraft(
          (data.guests || []).map((guest) => ({
            ...guest,
            tempId: guest._id,
          })),
        )
      } catch (error) {
        console.error(error)
      }
    }

    fetchEdition()
  }, [editionId, isEditEdition])

  const handleValidateEdition = async () => {
    if (!canValidateEdition) return

    try {
      const formData = new FormData()

      formData.append('year', editionDraft.year)
      formData.append('description', editionDraft.description)

      if (editionDraft.poster) {
        formData.append('poster', editionDraft.poster.fileId)
      }

      const response = await fetch(
        isEditEdition
          ? `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionId}`
          : 'https://fnb-backend.dokku.festnbreizh.bzh/api/editions',
        {
          method: isEditEdition ? 'PUT' : 'POST',
          body: formData,
        },
      )

      const result = await response.json()
      const finalEditionId = isEditEdition ? editionId : result.edition._id

      for (const artist of artistsDraft) {
        const artistFormData = new FormData()

        artistFormData.append('name', artist.name)
        artistFormData.append('description', artist.description)
        artistFormData.append('mediaType', artist.mediaType)
        artistFormData.append('media', artist.media)
        artistFormData.append('editionId', finalEditionId)

        await fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/artists', {
          method: 'POST',
          body: artistFormData,
        })
      }

      for (const guest of guestsDraft) {
        const guestFormData = new FormData()

        guestFormData.append('name', guest.name)
        guestFormData.append('description', guest.description)
        guestFormData.append('mediaType', guest.mediaType)
        guestFormData.append('media', guest.media)
        guestFormData.append('editionId', finalEditionId)

        await fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/guests', {
          method: 'POST',
          body: guestFormData,
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="edition__modal">
      <div className="edition__modal--content">
        <h2>
          {isEditEdition ? 'Modifier l’édition' : 'Créer une nouvelle édition'}
        </h2>

        <label>
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

        <label>
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

        <select
          value={editionDraft.poster?.fileId || ''}
          onChange={(e) => {
            const selectedPoster = posters.find(
              (poster) => poster.mediaFileIdSmall === e.target.value,
            )

            setEditionDraft({
              ...editionDraft,
              poster: selectedPoster
                ? {
                    url: selectedPoster.mediaUrlSmall,
                    fileId: selectedPoster.mediaFileIdSmall,
                  }
                : null,
            })
          }}
        >
          <option value="">Choisir une affiche</option>

          {posters.map((poster) => (
            <option
              key={poster.mediaFileIdSmall}
              value={poster.mediaFileIdSmall}
            >
              {poster.title || poster.name || 'Affiche'}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => setIsArtistModalOpen(true)}>
          Ajouter un artiste
        </button>

        {artistsDraft.map((artist) => (
          <div key={artist.tempId}>
            <p>{artist.name}</p>

            <button
              type="button"
              onClick={() => {
                setEditingArtist(artist)
                setIsArtistModalOpen(true)
              }}
            >
              Modifier
            </button>

            <button
              type="button"
              onClick={() =>
                setArtistsDraft(
                  artistsDraft.filter((item) => item.tempId !== artist.tempId),
                )
              }
            >
              Supprimer
            </button>
          </div>
        ))}

        <button type="button" onClick={() => setIsGuestModalOpen(true)}>
          Ajouter un invité
        </button>

        {guestsDraft.map((guest) => (
          <div key={guest.tempId}>
            <p>{guest.name}</p>

            <button
              type="button"
              onClick={() => {
                setEditingGuest(guest)
                setIsGuestModalOpen(true)
              }}
            >
              Modifier
            </button>

            <button
              type="button"
              onClick={() =>
                setGuestsDraft(
                  guestsDraft.filter((item) => item.tempId !== guest.tempId),
                )
              }
            >
              Supprimer
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={!canValidateEdition}
          onClick={handleValidateEdition}
        >
          {isEditEdition ? 'Valider les modifications' : 'Créer l’édition'}
        </button>

        {isArtistModalOpen && (
          <ModalArtist
            data={editingArtist}
            onClose={() => {
              setEditingArtist(null)
              setIsArtistModalOpen(false)
            }}
            onValidate={(artist) => {
              if (editingArtist) {
                setArtistsDraft(
                  artistsDraft.map((item) =>
                    item.tempId === editingArtist.tempId
                      ? { ...artist, tempId: editingArtist.tempId }
                      : item,
                  ),
                )
              } else {
                setArtistsDraft([
                  ...artistsDraft,
                  { ...artist, tempId: crypto.randomUUID() },
                ])
              }

              setEditingArtist(null)
              setIsArtistModalOpen(false)
            }}
          />
        )}

        {isGuestModalOpen && (
          <ModalGuest
            data={editingGuest}
            onClose={() => {
              setEditingGuest(null)
              setIsGuestModalOpen(false)
            }}
            onValidate={(guest) => {
              if (editingGuest) {
                setGuestsDraft(
                  guestsDraft.map((item) =>
                    item.tempId === editingGuest.tempId
                      ? { ...guest, tempId: editingGuest.tempId }
                      : item,
                  ),
                )
              } else {
                setGuestsDraft([
                  ...guestsDraft,
                  { ...guest, tempId: crypto.randomUUID() },
                ])
              }

              setEditingGuest(null)
              setIsGuestModalOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ModalEdition
