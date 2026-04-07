import './Modal.scss'
import { useState, useEffect } from 'react'

function Modal({
  isOpen,
  onClose,
  mode,
  fields,
  entityName,
  onSubmit,
  onChangeField,
}) {
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    mediaType: '',
    media: null,
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({})
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (onChangeField) {
      onChangeField(name, value)
    }
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
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.value)
                    }
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* FILE */}
                {field.type === 'file' && (
                  <input
                    type="file"
                    name={field.name}
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.files[0])
                    }
                  />
                )}

                {/* URL */}
                {field.type === 'url' && (
                  <input
                    placeholder={field.placeholder || 'URL'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
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
