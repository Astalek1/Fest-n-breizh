import './Modal.scss'
import { useState, useEffect } from 'react'

function Modal({ isOpen, onClose, mode, fields, entityName, onSubmit, data }) {
  const [formData, setFormData] = useState({})
  const [mediaType, setMediaType] = useState('photo')
  const [logoMode, setLogoMode] = useState('upload')
  const [logos, setLogos] = useState([])

  const isValid =
    mode === 'delete' ||
    (formData.text !== undefined &&
      formData.title &&
      formData.text.trim() !== '' &&
      (formData.mediaType === 'video'
        ? formData.media && formData.media.trim() !== ''
        : formData.media !== null && formData.media !== undefined)) ||
    // POSTERS / GALLERY
    fields.every((field) => {
      const value = formData[field.name]

      if (field.name === 'media') {
        if (formData.mediaType === 'video') {
          return value && value.trim() !== ''
        }
        return value !== null && value !== undefined
      }

      if (typeof value === 'string') {
        return value.trim() !== ''
      }

      return value !== null && value !== undefined
    })

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
    if (!isOpen) return

    //  EDIT → remplir avec les données
    if (mode === 'edit' && data) {
      setFormData({
        title: data.title || '',
        text: data.text || '',
        url: data.url || '',
        mediaType: data.mediaType || 'photo',
        media: data.media || data.url || null,
        year: data.year || '',
        caption: data.caption || '',
      })

      setMediaType(data.mediaType || 'photo')
      setLogoMode(data.mediaType === 'logo' ? 'existing' : 'upload')
    }
    //  CREATE → reset
    else if (mode === 'create') {
      setFormData(data || {})
      setMediaType(data?.mediaType || 'photo')
      setLogoMode('upload')
    }
  }, [isOpen, mode, data])

  if (!isOpen) return null

  const handleChange = (name, value) => {
    if (name === 'caption') {
      value = value.replace(/^©\s*/, '')
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  return (
    <div className="container__modal">
      <div className={`modal modal--${entityName}`}>
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
              <div className="modal__body--input" key={field.name}>
                <label htmlFor={field.name}>{field.label || field.name}</label>

                {/* TEXT */}
                {field.type === 'text' && (
                  <input
                    id={field.name}
                    name={field.name}
                    value={
                      field.name === 'text'
                        ? formData.text || formData.caption || ''
                        : formData[field.name] || ''
                    }
                    readOnly={field.readonly}
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.value)
                    }
                  />
                )}

                {/* TEXTAREA */}
                {field.type === 'textarea' && (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.value)
                    }
                  />
                )}

                {/* SELECT */}
                {field.type === 'select' && (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => {
                      handleChange(e.target.name, e.target.value)

                      if (field.name === 'mediaType') {
                        const value = e.target.value
                        setMediaType(value)
                        setLogoMode('upload')
                        handleChange('media', null)
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
              <>
                <input
                  type="file"
                  onChange={(e) => handleChange('media', e.target.files[0])}
                />
                {formData.media && (
                  <img
                    className="modal__preview"
                    src={
                      formData.media instanceof File
                        ? URL.createObjectURL(formData.media)
                        : formData.media
                    }
                    alt={formData.title || 'image'}
                  />
                )}
              </>
            )}

            {/* VIDEO */}
            {mediaType === 'video' && (
              <>
                <input
                  type="text"
                  placeholder="URL vidéo"
                  value={formData.media || ''}
                  onChange={(e) => handleChange('media', e.target.value)}
                />

                {formData.media &&
                  (formData.media.includes('youtube.com') ||
                  formData.media.includes('youtu.be') ? (
                    <iframe
                      className="modal__preview"
                      src={`https://www.youtube.com/embed/${
                        formData.media.split('v=')[1]?.split('&')[0] ||
                        formData.media.split('youtu.be/')[1]?.split('?')[0]
                      }`}
                      allowFullScreen
                      title={formData.title || 'video'}
                      aria-label={formData.title || 'video'}
                    />
                  ) : (
                    <video className="modal__preview" controls>
                      <source src={formData.media} />
                    </video>
                  ))}
              </>
            )}
            {/* LOGO */}
            {mediaType === 'logo' && (
              <div>
                <select
                  value={logoMode}
                  onChange={(e) => {
                    setLogoMode(e.target.value)
                    handleChange('media', null)
                  }}
                >
                  <option value="upload">Nouveau logo</option>
                  <option value="existing">logo déja présent</option>
                </select>

                {logoMode === 'upload' && (
                  <>
                    <input
                      type="file"
                      onChange={(e) => handleChange('media', e.target.files[0])}
                    />
                    {formData.media && (
                      <img
                        className="modal__preview"
                        src={URL.createObjectURL(formData.media)}
                        alt={formData.title || 'image'}
                      />
                    )}
                  </>
                )}

                {logoMode === 'existing' && (
                  <div>
                    <select
                      className="modal__select--existing"
                      onChange={(e) => handleChange('media', e.target.value)}
                    >
                      <option value="">Choisir un logo</option>

                      {logos.map((logo) => (
                        <option key={logo.fileId} value={logo.fileId}>
                          {logo.name}
                        </option>
                      ))}
                    </select>

                    {formData.media && (
                      <img
                        className="modal__preview"
                        src={
                          formData.media?.startsWith('http')
                            ? formData.media
                            : logos.find(
                                (logo) => logo.fileId === formData.media,
                              )?.url
                        }
                        alt={formData.title || 'image'}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="modal__txt--sup">Supprimer cet élément ?</p>
        )}

        {/* FOOTER */}
        <div className="modal__button">
          <button className="modal__button--close" onClick={onClose}>
            Annuler
          </button>
          <button
            className="modal__button--valid"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            {mode === 'delete' ? 'Supprimer' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
