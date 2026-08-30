import './Photos.scss'
import { useState, useEffect } from 'react'
import Modal from '../../components/Modal/Modal'

function Photos({ isEditing }) {
  const [photos, setPhotos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [selectedItem, setSelectedItem] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const fields = [
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      require: true,
    },
    { name: 'caption', type: 'text', label: 'caption', required: true },
    { name: 'media', type: 'media', label: ' media', required: true },
  ]

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos')
      .then((res) => res.json())
      .then((data) => setPhotos(Array.isArray(data) ? data : []))

      .catch((err) => console.error(err))
  }, [])

  const handleCreate = () => {
    setModalMode('create')

    setSelectedItem({
      title: '',
      caption: '',
      media: null,
    })

    setIsFormModalOpen(true)
  }

  const handleCreatePhoto = async (formData) => {
    const formDataToSend = new FormData()
    formDataToSend.append('media', formData.media)

    const photoData = {
      title: formData.title,
      year: formData.year,
      caption: formData.caption,
    }
    formDataToSend.append('photo', JSON.stringify(photoData))
    const token = sessionStorage.getItem('token')
    await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos',
      {
        method: 'POST',
        body: formDataToSend,
        headers: { Authorization: 'Bearer ' + token },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos',
    )

    const data = await res.json()
    setPhotos(data)
    setIsFormModalOpen(false)

    setPhotos(data)
    setIsFormModalOpen(false)
  }

  const handleEdit = (photo) => {
    setModalMode('edit')

    setSelectedItem({
      ...photo,
      title: photo.title,
      caption: photo.caption,
      media: photo.url,
    })
    setIsFormModalOpen(true)
  }

  const handleUpdatePhoto = async (formData) => {
    const formDataToSend = new FormData()
    const photoData = {
      title: formData.title,
      year: formData.year,
      caption: formData.caption,
    }
    if (formData.media instanceof File) {
      formDataToSend.append('media', formData.media)
    }
    formDataToSend.append('photo', JSON.stringify(photoData))

    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos/${selectedItem._id}`,
      {
        method: 'PUT',
        body: formDataToSend,
        headers: { Authorization: 'Bearer ' + token },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos',
    )

    const data = await res.json()

    setPhotos(data)
    setIsFormModalOpen(false)
  }

  const handleDeletePhoto = async () => {
    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos/${selectedItem._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/photos',
    )

    const data = await res.json()

    setPhotos(data)
    setIsFormModalOpen(false)
  }

  const handleSubmitModal = async (formData) => {
    if (modalMode === 'create') {
      handleCreatePhoto(formData)
    } else if (modalMode === 'edit') {
      handleUpdatePhoto(formData)
    } else if (modalMode === 'delete') {
      handleDeletePhoto()
    }
  }
  console.log(photos[0])
  return (
    <>
      <div className="page__titlePhoto">
        <h1>Photos</h1>
        <p className="page__titlePhoto--txt">
          Retrouvez ici une sélection de photos des différentes éditions de
          Fest'n Breizh. Elles témoignent des concerts, des rencontres et des
          nombreux moments de convivialité qui font la richesse de l'événement.
          <br />
          Nous remercions chaleureusement toutes les personnes qui ont contribué
          à capturer et à partager ces précieux souvenirs.
          <br />
          <br />
          Cliquez sur une photo pour l'afficher.
        </p>
      </div>
      {isEditing && (
        <button title="créé" className="button__create" onClick={handleCreate}>
          ajouter une nouvelle
          <br />
          affiche
        </button>
      )}

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
            {isEditing && (
              <div className="button__editPhoto">
                <button
                  title="modifier"
                  className="button__edit--modif"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(item)
                  }}
                >
                  📝
                </button>
                <button
                  title="suprimer"
                  className="button__edit--suprim"
                  onClick={(e) => {
                    e.stopPropagation()
                    setModalMode('delete')
                    setSelectedItem(item)
                    setIsFormModalOpen(true)
                  }}
                >
                  🗑
                </button>
              </div>
            )}
            <img
              src={item.urlSmall}
              alt={`photo ${item.title}`}
              className="photo__img"
            />
            <figcaption className="photo__figcaption">
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
              className="modal__photo--img"
              src={selectedPhoto.url}
              alt={`photo ${selectedPhoto.title}`}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={modalMode}
        fields={fields}
        onSubmit={handleSubmitModal}
        data={selectedItem}
        entityName="une Photo"
      />
    </>
  )
}

export default Photos
