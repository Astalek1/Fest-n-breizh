import { useState } from 'react'

function ModalGuest({ data, onClose, onValidate }) {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    description: data?.description || '',
    mediaType: data?.mediaType || null,
    media: data?.media || '',
  })
  return (
    <div className="guest__modal">
      <div className="guest__modal--content">
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

          <div className="guest__modal--media">
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
                    className="guest__modal--preview"
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
                <iframe
                  className="guest__modal--preview"
                  src={`https://www.youtube.com/embed/${
                    formData.media.split('v=')[1]?.split('&')[0] ||
                    formData.media.split('youtu.be/')[1]?.split('?')[0]
                  }`}
                  title={formData.name || 'video'}
                  allowFullScreen
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
                    className="guest__modal--preview"
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

export default ModalGuest
