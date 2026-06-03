import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ModalEdition from '../../components/ModalEdition/ModalEdition.jsx'

function CreateEditionPage({ isEditing }) {
  const { editionId } = useParams()
  const isEditEdition = Boolean(editionId)

  const navigate = useNavigate()
  useEffect(() => {
    if (!isEditing) {
      navigate('/Editions')
    }
  }, [isEditing, navigate])

  const [previewEdition, setPreviewEdition] = useState({
    year: '',
    description: '',
    poster: null,
    artists: [],
    guests: [],
  })

  return (
    <main className="create__edition--page">
      <section className="edition__preview">
        {previewEdition.year && <h1>Edition {previewEdition.year}</h1>}

        {previewEdition.poster?.url && (
          <img
            src={previewEdition.poster.url}
            alt={`Edition ${previewEdition.year}`}
          />
        )}

        {previewEdition.description && <p>{previewEdition.description}</p>}

        {previewEdition.artists.length > 0 && (
          <>
            <h2>Artistes</h2>
            {previewEdition.artists.map((artist) => (
              <div key={artist.tempId}>
                <h3>{artist.name}</h3>
                <p>{artist.description}</p>
              </div>
            ))}
          </>
        )}

        {previewEdition.guests.length > 0 && (
          <>
            <h2>Invités</h2>
            {previewEdition.guests.map((guest) => (
              <div key={guest.tempId}>
                <h3>{guest.name}</h3>
                <p>{guest.description}</p>
              </div>
            ))}
          </>
        )}
      </section>

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
