import './Modal.scss'
import { useState, useEffect } from 'react'

function Modal({ isOpen, onClose, mode, fields, data, entityName, onSubmit }) {
  // state local (simplifié)
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    mediaType: data?.mediaType || 'image',
  })
  const [mediaType, setMediaType] = useState(data?.mediaType || 'image')
  const [mediaSource, setMediaSource] = useState('upload')
  const [logos, setLogos] = useState([])

  useEffect(() => {
    if (mediaType === 'logo' && mediaSource === 'existing') {
      fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/files/logos')
        .then((res) => res.json())
        .then((data) => {
          console.log('LOGOS:', data)
          setLogos(data)
        })
        .catch((err) => console.error(err))
    }
  }, [mediaType, mediaSource])

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
                <option value="photo">Image</option>
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
                {mediaSource === 'existing' && (
                  <select
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        file: e.target.value,
                      }))
                    }
                  >
                    <option value="">Choisir un logo</option>

                    {logos.map((logo) => (
                      <option key={logo.fileId} value={logo.fileId}>
                        {logo.name}
                      </option>
                    ))}
                  </select>
                )}
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
