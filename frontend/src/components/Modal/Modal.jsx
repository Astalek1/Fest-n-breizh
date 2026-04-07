import './Modal.scss'
import { useState } from 'react'

function Modal({ isOpen, onClose, mode, fields, data, entityName, onSubmit }) {
  // state local (simplifié)
  const [formData, setFormData] = useState(data || {})
  const [mediaType, setMediaType] = useState(data?.mediaType || 'image')
  const [mediaSource, setMediaSource] = useState('upload')

  if (!isOpen) return null

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  return (
    <div className="container__modal">
      <div className="modal">
        {/* HEADER */}
        <h2 className="modal__title">
          {mode === 'create' && `Ajouter ${entityName}`}
          {mode === 'edit' && `Modifier ${entityName}`}
          {mode === 'delete' && `Supprimer ${entityName}`}
        </h2>

        {/* BODY */}
        {mode !== 'delete' ? (
          <div className="modal__body">
            {/* champs dynamiques */}
            {fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name}>{field.label || field.name}</label>
                {field.type === 'text' && (
                  <input
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div>
              <label>Type de média</label>
              <select
                value={mediaType}
                onChange={(e) => {
                  setMediaType(e.target.value)
                  setFormData((prev) => ({
                    ...prev,
                    mediaType: e.target.value,
                  }))
                }}
              >
                <option value="image">Image</option>
                <option value="logo">Logo</option>
                <option value="video">Vidéo</option>
              </select>
            </div>

            {/* gestion media */}
            {mediaType === 'image' && <input type="file" />}

            {mediaType === 'video' && <input placeholder="URL vidéo" />}

            {mediaType === 'logo' && (
              <div>
                <select onChange={(e) => setMediaSource(e.target.value)}>
                  <option value="upload">Upload</option>
                  <option value="existing">Existant</option>
                </select>

                {mediaSource === 'upload' && <input type="file" />}
                {mediaSource === 'existing' && <select>{/* logos */}</select>}
              </div>
            )}
          </div>
        ) : (
          <p>Supprimer cet élément ?</p>
        )}

        {/* FOOTER */}
        <div className="modal__button">
          <button className="modal__button--close" onClick={onClose}>
            Annuler
          </button>
          <button className="modal__button--valid" onClick={handleSubmit}>
            {mode === 'delete' ? 'Supprimer' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
