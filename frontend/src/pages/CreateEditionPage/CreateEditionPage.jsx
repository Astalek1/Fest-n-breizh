import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function CreateEditionPage() {
  const [editionDraft, setEditionDraft] = useState({
    year: '',
    description: '',
    poster: null,
  })
  const { editionId } = useParams()
  const isEditEdition = Boolean(editionId)
  const [artistsDraft, setArtistsDraft] = useState([])
  const [guestsDraft, setGuestsDraft] = useState([])
  const [editingArtist, setEditingArtist] = useState(null)
  const [editingGuest, setEditingGuest] = useState(null)
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false)
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)

  const handleValidateEdition = async () => {
    if (artistsDraft.length === 0) return

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
          : `https://fnb-backend.dokku.festnbreizh.bzh/api/editions`,
        {
          method: isEditEdition ? 'PUT' : 'POST',
          body: formData,
        },
      )

      const createdEdition = await response.json()
      const finalEditionId = isEditEdition
        ? editionId
        : createdEdition.edition._id

      for (const artist of artistsDraft) {
        const artistFormData = new FormData()

        artistFormData.append('name', artist.name)
        artistFormData.append('description', artist.description)
        artistFormData.append('mediaType', artist.mediaType)
        artistFormData.append('media', artist.media)
        artistFormData.append('editionId', finalEditionId)

        await fetch(`https://fnb-backend.dokku.festnbreizh.bzh/api/artists`, {
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

        await fetch(`https://fnb-backend.dokku.festnbreizh.bzh/api/guests`, {
          method: 'POST',
          body: guestFormData,
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const canValidateEdition = artistsDraft.length > 0

  useEffect(() => {
    if (!isEditEdition) return

    const fetchEdition = async () => {
      try {
        const response = await fetch(
          `https://fnb-backend.dokku.festnbreizh.bzh/api/editions/${editionId}`,
        )

        const data = await response.json()
        console.log('Réponse édition:', data)

        setEditionDraft({
          year: data.year || '',
          description: data.description || '',
          poster: data.poster
            ? // a surveiller pour l'affichage prewiew du poster//
              {
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

  return (
    <main className="create__edition--page">
      <section className="edition__preview">
        <h1>Edition {editionDraft.year}</h1>

        {editionDraft.poster && (
          <img src={editionDraft.poster.url} alt={editionDraft.title} />
        )}

        <p>{editionDraft.description}</p>
      </section>

      <section className="edition__actions">
        <button onClick={() => setIsEditionModalOpen(true)}>
          {isEditEdition
            ? 'Modifier les infos de l’édition'
            : 'Ajouter les infos de l’édition'}
        </button>

        <button onClick={() => setIsArtistModalOpen(true)}>
          {isEditEdition ? 'Modifier un Artiste' : 'Ajouter un Artiste'}
        </button>

        <button onClick={() => setIsGuestModalOpen(true)}>
          {isEditEdition ? 'Modifier un Invité' : 'Ajouter un Invité'}
        </button>
      </section>

      <section className="edition__artists">
        <h2>Artistes</h2>

        {artistsDraft.map((artist) => (
          <div key={artist.tempId}>
            <h3>{artist.name}</h3>
            <p>{artist.description}</p>
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
      </section>

      <section className="edition__guests">
        <h2>Invités</h2>

        {guestsDraft.map((guest) => (
          <div key={guest.tempId}>
            <h3>{guest.name}</h3>
            <p>{guest.description}</p>
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
      </section>

      <button
        type="button"
        disabled={!canValidateEdition}
        onClick={handleValidateEdition}
      >
        Valider l’édition
      </button>

      <button>Annuler</button>

      {isEditionModalOpen && (
        <ModalEdition
          data={editionDraft}
          onClose={() => {
            setIsEditionModalOpen(false)
          }}
          onValidate={(data) => {
            setEditionDraft(data)
            setIsEditionModalOpen(false)
          }}
        />
      )}

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
    </main>
  )
}

export default CreateEditionPage
