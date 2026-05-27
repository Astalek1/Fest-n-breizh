import { useState } from 'react'

function CreateEditionPage() {
  const [editionDraft, setEditionDraft] = useState({
    year: '',
    description: '',
    poster: null,
  })

  const [artistsDraft, setArtistsDraft] = useState([])
  const [guestsDraft, setGuestsDraft] = useState([])

  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false)
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)

  const canValidateEdition = artistsDraft.length > 0

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
          Modifier les infos de l’édition
        </button>

        <button onClick={() => setIsArtistModalOpen(true)}>
          Ajouter un artiste
        </button>

        <button onClick={() => setIsGuestModalOpen(true)}>
          Ajouter un invité
        </button>
      </section>

      <section className="edition__artists">
        <h2>Artistes</h2>

        {artistsDraft.map((artist) => (
          <div key={artist.tempId}>
            <h3>{artist.name}</h3>
            <p>{artist.description}</p>
          </div>
        ))}
      </section>

      <section className="edition__guests">
        <h2>Invités</h2>

        {guestsDraft.map((guest) => (
          <div key={guest.tempId}>
            <h3>{guest.name}</h3>
            <p>{guest.description}</p>
          </div>
        ))}
      </section>

      <button disabled={!canValidateEdition}>Valider l’édition</button>

      <button>Annuler</button>

      {isEditionModalOpen && (
        <EditionModal
          data={editionDraft}
          onClose={() => setIsEditionModalOpen(false)}
          onValidate={(data) => {
            setEditionDraft(data)
            setIsEditionModalOpen(false)
          }}
        />
      )}

      {isArtistModalOpen && (
        <ArtistModal
          onClose={() => setIsArtistModalOpen(false)}
          onValidate={(artist) => {
            setArtistsDraft([...artistsDraft, artist])
            setIsArtistModalOpen(false)
          }}
        />
      )}

      {isGuestModalOpen && (
        <GuestModal
          onClose={() => setIsGuestModalOpen(false)}
          onValidate={(guest) => {
            setGuestsDraft([...guestsDraft, guest])
            setIsGuestModalOpen(false)
          }}
        />
      )}
    </main>
  )
}

export default CreateEditionPage
