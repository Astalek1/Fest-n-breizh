//import './Photos.scss'

import { useState, useEffect } from 'react'

function Photos() {
  const [photos, setPhotos] = useState([])

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
          <figure key={item._id} className="photo__item">
            <img src={item.urlSmall} alt={item.alt} className="photo__img" />
            <figcaption>
              <h2 className="photo__title">{item.title}</h2>
              {item.caption && (
                <p className="photo__caption">&copy; {item.caption}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}

export default Photos
