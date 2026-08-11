import { useState, useEffect } from 'react'
import './ModalArtist.scss'
import { getYouTubeEmbedUrl } from '../../utils/youtube'

function ModalArtist({ data, onClose, onValidate }) {
  const buildFormData = (data) => ({
    ...data,
    name: data?.name || '',
    description: data?.description || '',
    mediaType:
      data?.mediaType || (data?.media?.includes('/logos/') ? 'logo' : null),
    media: data?.media || '',
  })
  const [formData, setFormData] = useState(buildFormData(data))

  useEffect(() => {
    if (!data) return
    setFormData(buildFormData(data))
  }, [data])

  const [logoMode, setLogoMode] = useState('upload')
  const [logos, setLogos] = useState([])

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const response = await fetch(
          'https://fnb-backend.dokku.festnbreizh.bzh/api/files/logos',
        )

        const data = await response.json()
        setLogos(data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchLogos()
  }, [])
  return (
    <div className="artist__modal">
      <div className="artist__modal--content">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onValidate(formData)
          }}
        >
          <section className="artist__modal--section">
            <label className="artist__modal--label">nom</label>
            <input
              className="artist__modal--input"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </section>
          <section className="artist__modal--section">
            <label className="artist__modal--label">déscription </label>
            <textarea
              className="artist__modal--input"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
          </section>
          <section className="artist__modal--section">
            <label className="artist__modal--label">Type de média</label>
            <select
              className="artist__modal--input"
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
              <option value="image">Image</option>
              <option value="logo">Logo</option>
              <option value="video">Vidéo</option>
            </select>

            <div className="artist__modal--section">
              {(formData.mediaType === 'photo' ||
                formData.mediaType === 'image') && (
                <>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0]

                      setFormData({
                        ...formData,
                        media: file,
                        fileName: file.name.replace(/\.[^/.]+$/, ''),
                      })
                    }}
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
                  <iframe
                    className="artist__modal--preview"
                    src={getYouTubeEmbedUrl(formData.media)}
                    title={formData.name || 'video'}
                    allowFullScreen
                  />
                </>
              )}
              {formData.mediaType === 'logo' && (
                <div className="artist__modal--label">
                  <select
                    value={logoMode}
                    onChange={(e) => {
                      setLogoMode(e.target.value)
                      setFormData({
                        ...formData,
                        media: null,
                      })
                    }}
                  >
                    <option value="upload">Nouveau logo</option>
                    <option value="existing">Logo déjà présent</option>
                  </select>

                  {logoMode === 'upload' && (
                    <>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0]

                          setFormData({
                            ...formData,
                            media: file,
                            fileName: file.name.replace(/\.[^/.]+$/, ''),
                          })
                        }}
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

                  {logoMode === 'existing' && (
                    <>
                      <select
                        value={
                          typeof formData.media === 'string'
                            ? formData.media
                            : ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            media: e.target.value,
                          })
                        }
                      >
                        <option value="">Choisir un logo</option>

                        {logos.map((logo) => (
                          <option key={logo.fileId} value={logo.fileId}>
                            {logo.name}
                          </option>
                        ))}
                      </select>

                      {typeof formData.media === 'string' && formData.media && (
                        <img
                          className="artist__modal--preview"
                          src={
                            logos.find((logo) => logo.fileId === formData.media)
                              ?.url || ''
                          }
                          alt={formData.name || 'logo'}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
          <section className="artist__btn">
            <button
              className="artist__btn--validate"
              title="valider"
              type="submit"
            >
              Valider
            </button>

            <button
              className="artist__btn--cancel"
              title="annuler"
              type="button"
              onClick={onClose}
            >
              Annuler
            </button>
          </section>
        </form>
      </div>
    </div>
  )
}

export default ModalArtist
