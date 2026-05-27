import { useState } from 'react'

function ModalEdition({ data, onClose, onValidate }) {
  const [formData, setFormData] = useState({
    year: data?.year || '',
    description: data?.description || '',
    poster: data?.poster || null,
  })
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
