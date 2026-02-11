import './Photos.scss'
import { useState, useEffect } from 'react'

function Photos() {
  const [photos, setPhotos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos')
      .then((res) => res.json())
      .then((data) => setPhotos(Array.isArray(data) ? data : []))

      .catch((err) => console.error(err))
  }, [])

  return (
    <>
      <div className="page__title">
        <h1>les Photos</h1>
        <p>voicis quelques photos des differents événements.</p>
      </div>

      <div className="photo__container">
        {photos.map((item) => (
          <figure
            key={item._id}
            className="photo"
            onClick={() => {
              setSelectedPhoto(item)
              setIsModalOpen(true)
            }}
          >
            <img
              src={item.urlSmall}
              alt={`photo ${item.title}`}
              className="photo__img"
            />
            <figcaption classname="photo__figcaption">
              <h2 className="photo__title">{item.title}</h2>
              {item.caption && (
                <p className="photo__caption">&copy; {item.caption}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
      {isModalOpen && selectedPhoto && (
        <div className="modal__photo" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal__photo--content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="modal__photo--close"
              onClick={() => setIsModalOpen(false)}
            >
              &#9746;
            </span>
            <img
              className="modal__poster--img"
              src={selectedPhoto.url}
              alt={`affiche ${selectedPhoto.title}`}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Photos
