import { useState } from 'react'
import './ModalEdition.scss'

function ModalEdition({ data, onClose, onValidate }) {
  console.log('ModalEdition ouverte')
  const [formData, setFormData] = useState({
    year: data?.year || '',
    description: data?.description || '',
    poster: data?.poster || null,
  })

  const posters = []

  return (
    <div className="edition__modal">
      <div className="edition__modal--content">
        <h2>Informations de l’édition</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onValidate(formData)
          }}
        >
          <label>
            Année
            <input
              type="text"
              value={formData.year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  year: e.target.value,
                })
              }
            />
          </label>

          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </label>

          <button type="button">Sélectionner une affiche</button>

          <select
            value={formData.poster?.fileId || ''}
            onChange={(e) => {
              const selectedPoster = posters.find(
                (poster) => poster.mediaFileIdSmall === e.target.value,
              )

              setFormData({
                ...formData,
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

          <button type="submit">Valider</button>

          <button type="button" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  )
}

export default ModalEdition
