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
  const [selectedMediaType, setSelectedMediaType] = useState('photo')

  const fields = [
    { name: 'title', type: 'text', label: 'Titre' },
    { name: 'text', type: 'textarea', label: 'Texte' },

    {
      name: 'mediaType',
      type: 'select',
      label: 'Type de média',
      options: [
        { value: 'photo', label: 'Image' },
        { value: 'logo', label: 'Logo' },
        { value: 'video', label: 'Vidéo' },
      ],
    },
    {
      type: selectedMediaType === 'logo' ? 'select' : null,
      options: [
        { value: 'upload', label: 'Upload' },
        { value: 'existing', label: 'Existant' },
      ],
    },

    {
      name: 'media',
      type:
        selectedMediaType === 'video'
          ? 'url'
          : selectedMediaType === 'logo'
            ? 'logo'
            : 'file',
      label: 'Média',
    },
  ]

  const handleSubmit = async (data) => {
    try {
      if (modalMode === 'delete') {
        const token = sessionStorage.getItem('token')

        await fetch(
          `https://fnb-backend.dokku.festnbreizh.bzh/api/announcements/${selectedItem._id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: 'Bearer ' + token,
            },
          },
        )

        // refresh
        const updatedList = await fetch(
          'https://fnb-backend.dokku.festnbreizh.bzh/api/announcements',
        ).then((res) => res.json())

        setAnnouncements(updatedList)

        setIsModalOpen(false)
        return
      }
      if (modalMode === 'edit') {
        const token = sessionStorage.getItem('token')

        const formData = new FormData()

        formData.append(
          'announcement',
          JSON.stringify({
            title: data.title,
            text: data.text,
            mediaType: data.mediaType,
            media: data.media,
          }),
        )

        if (data.media instanceof File) {
          formData.append('media', data.media)
        }

        await fetch(
          `https://fnb-backend.dokku.festnbreizh.bzh/api/announcements/${selectedItem._id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer ' + token,
            },
            body: formData,
          },
        )

        // refresh
        const updatedList = await fetch(
          'https://fnb-backend.dokku.festnbreizh.bzh/api/announcements',
        ).then((res) => res.json())

        setAnnouncements(updatedList)

        setIsModalOpen(false)
        return
      }
      const token = sessionStorage.getItem('token')

      const formData = new FormData()

      formData.append(
        'announcement',
        JSON.stringify({
          title: data.title,
          text: data.text,
          mediaType: data.mediaType || 'photo',
          media: data.media, // URL ou null
        }),
      )

      if (data.media instanceof File) {
        formData.append('media', data.media)
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

      // attendre que le backend ait fini
      const result = await res.json()
      console.log(result)

      // ensuite refresh
      const updatedList = await fetch(
        'https://fnb-backend.dokku.festnbreizh.bzh/api/announcements',
      ).then((res) => res.json())

      setAnnouncements(updatedList)
    } catch (err) {
      console.error(err)
    }

    setIsModalOpen(false)
  }

  const [selectedItem, setSelectedItem] = useState(null)

  const handleEdit = (item) => {
    setModalMode('edit')
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = (item) => {
    setModalMode('delete')
    setSelectedItem(item)
    setIsModalOpen(true)
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
            title="créé"
            className="button__create"
            onClick={() => {
              setModalMode('create')
              setIsModalOpen(true)
            }}
          >
            créé une nouvelle
            <br />
            annonce
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
                {isEditing && (
                  <div className="button__edit">
                    <button
                      title="modifier"
                      className="button__edit--modif"
                      onClick={() => handleEdit(item)}
                    >
                      📝
                    </button>
                    <button
                      title="suprimer"
                      className="button__edit--suprim"
                      onClick={() => handleDelete(item)}
                    >
                      🗑
                    </button>
                  </div>
                )}
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
                {item.mediaType === 'video' &&
                  (item.media || item.url) &&
                  ((item.media || item.url).includes('youtube') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${new URL(
                        item.media || item.url,
                      ).searchParams.get('v')}`}
                      title={item.title}
                      allowFullScreen
                      className="announcement__video"
                    />
                  ) : (
                    <video controls className="announcement__video">
                      <source src={item.media || item.url} />
                    </video>
                  ))}
              </article>
            ))
          )}
        </div>
      </div>
      <Modal
        key={selectedMediaType + isModalOpen}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        fields={fields}
        onChangeField={(name, value) => {
          if (name === 'mediaType') {
            setSelectedMediaType(value)
          }
        }}
        data={selectedItem}
        entityName="une annonce"
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default Home
