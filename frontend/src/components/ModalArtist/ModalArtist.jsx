import { useState } from 'react'

function ModalArtist({ data, onClose, onValidate }) {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    description: data?.description || '',
    mediaType: data?.mediaType || null,
    media: data?.media || '',
  })

  return (
    <div className="artist__modal">
      <div className="artist__modal--content">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onValidate(formData)
          }}
        >
          <label>
            nom
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </label>

          <label>
            déscription
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
          </label>

          <label>
            Type de média
            <select
              value={formData.mediaType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mediaType: e.target.value,
                  media: '',
                })
              }
            >
              <option value="">Choisir un type</option>
              <option value="photo">Image</option>
              <option value="logo">Logo</option>
              <option value="video">Vidéo</option>
            </select>
          </label>

          <div className="artist__modal--media">
            {formData.mediaType === 'photo' && (
              <>
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      media: e.target.files[0],
                    })
                  }
                />

                {formData.media && (
                  <img
                    className="artist__modal--preview"
                    src={
                      formData.media instanceof File
                        ? URL.createObjectURL(formData.media)
                        : formData.media
                    }
                    alt={formData.name || 'photo'}
                  />
                )}
              </>
            )}

            {formData.mediaType === 'video' && (
              <>
                <input
                  type="text"
                  placeholder="URL vidéo"
                  value={formData.media || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      media: e.target.value,
                    })
                  }
                />
              </>
            )}

            {formData.mediaType === 'logo' && (
              <>
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      media: e.target.files[0],
                    })
                  }
                />

                {formData.media && (
                  <img
                    className="artist__modal--preview"
                    src={
                      formData.media instanceof File
                        ? URL.createObjectURL(formData.media)
                        : formData.media
                    }
                    alt={formData.name || 'logo'}
                  />
                )}
              </>
            )}
          </div>

          <button type="submit">Valider</button>

          <button type="button" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  )
}

export default ModalArtist
