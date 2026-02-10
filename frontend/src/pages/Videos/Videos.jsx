import './Videos.scss'
import { useState, useEffect } from 'react'

function Videos() {
  const [videos, setvideos] = useState([])

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/videos')
      .then((res) => res.json())
      .then((data) => setvideos(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <>
      <div className="video__intro">
        <h1 className="video__intro--title">Nos vidéo sur Youtube</h1>

        <p className="video__intro--txt">
          Retrouvez ici toutes les actualités du festival : nouveautés,
          événements, invités, informations importantes et moments forts à
          venir.
        </p>
      </div>
      <div className="videos">
        {videos.map((item) => (
          <article className="videos__content" key={item._id}>
            <h2 className="videos__title">{item.title}</h2>
            <p className="videos__txt">{item.description}</p>

            <iframe
              className="videos__windows"
              src={item.url.replace('watch?v=', 'embed/')}
              title={item.title}
              allowFullScreen
            />
          </article>
        ))}
      </div>
    </>
  )
}

export default Videos
