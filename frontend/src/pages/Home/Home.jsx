import { useState, useEffect } from 'react'
import './Home.scss'

function Home() {
  const carouselImages = [
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-1.webp?updatedAt=1765968510369',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-2.webp?updatedAt=1765968510579',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-3.webp?updatedAt=1765968510551',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-4.webp?updatedAt=1765968510586',
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselImages.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [carouselImages.length])

  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error(err))
    //setAnnouncements([])
  }, [])

  return (
    <>
      <div className="slideshow">
        <div
          className="slideshow__img"
          style={{ backgroundImage: `url(${carouselImages[index]})` }}
        ></div>

        <div className="slideshow__overlay"></div>

        <div className="slideshow__text">
          <span className="slideshow__span">Fest’n Breizh </span>
          vous souhaite la bienvenue !
        </div>
      </div>

      <div className="home">
        <h1 className="homme__title">
          Les petites annonces de Fest’n Breizh!!!
        </h1>

        <p className="home__text">
          Retrouvez ici toutes les actualités du festival : nouveautés,
          événements, invités, informations importantes et moments forts à
          venir.
        </p>
        <div className="announcements">
          {announcements.length === 0 ? (
            <>
              <h2 className="announcements__message">
                Aucune annonce pour le moment.
              </h2>

              <p className="announcements__message--txt">
                Restez à l'affût des prochaines informations à venir!
              </p>
            </>
          ) : (
            announcements.map((item) => (
              <article className="announcement" key={item._id}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>

                {item.mediaType === 'photo' && (
                  <img
                    className="announcement__photo"
                    src={item.media}
                    alt={item.title}
                  />
                )}

                {item.mediaType === 'logo' && (
                  <img
                    className="announcement__logo"
                    src={item.logo || item.media}
                    alt={item.title}
                  />
                )}

                {item.mediaType === 'video' && (
                  <iframe
                    className="announcement__video"
                    src={item.url.replace('watch?v=', 'embed/')}
                    title={item.title}
                    allowFullScreen
                  />
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default Home
