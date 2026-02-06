import './Posters.scss'
import { useState, useEffect } from 'react'

function Posters() {
  const [posters, setPosters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPoster, setSelectedPoster] = useState(null)

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters')
      .then((res) => res.json())
      .then((data) =>
        setPosters(
          Array.isArray(data) ? data.sort((a, b) => a.year - b.year) : [],
        ),
      )

      .catch((err) => console.error(err))
  }, [])

  return (
    <>
      <div className="page__title">
        <h1>les Affiches</h1>
        <p>
          voicis les affiches de toutes les édition de fest'n breizh depuis son
          commencement en 2009.
        </p>
      </div>

      <div className="poster__container">
        {posters.map((item) => (
          <figure
            key={item._id}
            className="poster"
            onClick={() => {
              setSelectedPoster(item)
              setIsModalOpen(true)
            }}
          >
            <h2 className="poster__title">
              {item.title} {item.year}
            </h2>
            <img src={item.urlSmall} alt={item.alt} className="poster__img" />
            <figcaption>
              {item.caption && (
                <p className="poster__figcaption">&copy; {item.caption}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {isModalOpen && selectedPoster && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="modal__content">
            <span
              className="modal__close"
              onClick={() => setIsModalOpen(false)}
            >
              &#9746;
            </span>
            <img
              className="modal__content--img"
              src={selectedPoster.url}
              alt={selectedPoster.alt}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Posters
