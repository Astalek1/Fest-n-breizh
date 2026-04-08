import './Modal.scss'
import { useState, useEffect } from 'react'

function Modal({ isOpen, onClose, mode, fields, entityName, onSubmit }) {
  const [formData, setFormData] = useState({})
  const [mediaType, setMediaType] = useState('photo')
  const [logoMode, setLogoMode] = useState('upload')
  const [logos, setLogos] = useState([])

  useEffect(() => {
    if (mediaType === 'logo' && logoMode === 'existing') {
      fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/files/logos')
        .then((res) => res.json())
        .then((data) => {
          setLogos(data)
        })
        .catch((err) => console.error(err))
    }
  }, [mediaType, logoMode])

  useEffect(() => {
    if (isOpen) {
      setFormData({})
      setMediaType('photo')
      setLogoMode('upload')
    }
  }, [isOpen])

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
            {fields.map((field) => (
              <div key={field.name}>
                <label>{field.label || field.name}</label>

                {/* TEXT */}
                {field.type === 'text' && (
                  <input
                    name={field.name}
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.value)
                    }
                  />
                )}

                {/* TEXTAREA */}
                {field.type === 'textarea' && (
                  <textarea
                    name={field.name}
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.value)
                    }
                  />
                )}

                {/* SELECT */}
                {field.type === 'select' && (
                  <select
                    name={field.name}
                    onChange={(e) => {
                      handleChange(e.target.name, e.target.value)

                      if (field.name === 'mediaType') {
                        const value = e.target.value
                        setMediaType(value)

                        // reset propre quand on change de type
                        setLogoMode('upload')
                      }
                    }}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            {/* MEDIA DYNAMIQUE */}

            {/* PHOTO */}
            {mediaType === 'photo' && (
              <input
                type="file"
                onChange={(e) => handleChange('media', e.target.files[0])}
              />
            )}

            {/* VIDEO */}
            {mediaType === 'video' && (
              <input
                type="text"
                placeholder="URL vidéo"
                onChange={(e) => handleChange('media', e.target.value)}
              />
            )}

            {/* LOGO */}
            {mediaType === 'logo' && (
              <div>
                <select onChange={(e) => setLogoMode(e.target.value)}>
                  <option value="upload">Upload</option>
                  <option value="existing">Existant</option>
                </select>

                {logoMode === 'upload' && (
                  <input
                    type="file"
                    onChange={(e) => handleChange('media', e.target.files[0])}
                  />
                )}

                {logoMode === 'existing' && (
                  <select
                    onChange={(e) => handleChange('media', e.target.value)}
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
