import { useState, useEffect } from 'react'
import './Home.scss'
import Modal from '../../components/Modal/Modal'

function Home({ isEditing }) {
  const carouselImages = [
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-1.webp?updatedAt=1765968510369',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-2.webp?updatedAt=1765968510579',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-3.webp?updatedAt=1765968510551',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-4.webp?updatedAt=1765968510586',
  ]

  const [index, setIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const fields = [
    { name: 'title', type: 'text', label: 'Titre' },
    { name: 'text', type: 'textarea', label: 'Texte' },
  ]

  const handleSubmit = async (data) => {
    try {
      const token = sessionStorage.getItem('token')

      const formData = new FormData()

      // champs texte
      formData.append('title', data.title || '')
      formData.append('text', data.text || '')

      // type de média
      formData.append('mediaType', data.mediaType)

      // logo existant
      if (data.mediaType === 'logo' && data.file) {
        formData.append('media', data.file)
      }
      console.log('DATA SENT:', data)
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1])
      }
      const res = await fetch(
        'https://fnb-backend.dokku.festnbreizh.bzh/api/announcements',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
          },
          body: formData,
        },
      )

      const result = await res.json()
      console.log('RESULT:', JSON.stringify(result, null, 2))
    } catch (err) {
      console.error(err)
    }

    setIsModalOpen(false)
  }
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
      <div className={`slideshow ${isEditing ? 'edit-mode' : ''}`}>
        <div
          className="slideshow__img"
          style={{ backgroundImage: `url(${carouselImages[index]})` }}
        ></div>

        <div className="slideshow__overlay"></div>

        <div className="slideshow__txt">
          <span className="slideshow__span">Fest’n Breizh </span>
          vous souhaite la bienvenue !
        </div>
      </div>

      <div className="home">
        <div className="home__intro">
          <h1 className="homme__title">
            Les petites annonces de Fest’n Breizh!!!
          </h1>

          <p className="home__txt">
            Retrouvez ici toutes les actualités du festival : nouveautés,
            événements, invités, informations importantes et moments forts à
            venir.
          </p>
        </div>
        {isEditing && (
          <button
            className="button__create"
            onClick={() => {
              setModalMode('create')
              setIsModalOpen(true)
            }}
          >
            créé une annonce
          </button>
        )}
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

                {item.mediaType === 'logo' && item.media && (
                  <img
                    className="announcement__logo"
                    src={item.logo || item.media}
                    alt={`logo ${item.name}`}
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        fields={fields}
        data={null}
        entityName="announcement"
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default Home
