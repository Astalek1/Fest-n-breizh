import './Posters.scss'
import { useState, useEffect } from 'react'
import Modal from '../../components/Modal/Modal'

function Posters({ isEditing }) {
  const [posters, setPosters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPoster, setSelectedPoster] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [selectedItem, setSelectedItem] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const fields = [
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      readonly: true,
      require: true,
    },
    { name: 'year', type: 'text', label: 'année', required: true },
    { name: 'caption', type: 'text', label: 'caption', required: true },
    { name: 'media', type: 'media', label: ' media', required: true },
  ]

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

  const handleCreate = () => {
    setModalMode('create')

    setSelectedItem({
      title: "Fest'n Breizh",
      year: '',
      caption: '',
      media: null,
    })

    setIsFormModalOpen(true)
  }

  const handleCreatePoster = async (formData) => {
    const formDataToSend = new FormData()
    formDataToSend.append('media', formData.media)

    const posterData = {
      title: "Fest'n Breizh " + formData.year,
      year: formData.year,
      caption: formData.caption,
    }
    formDataToSend.append('poster', JSON.stringify(posterData))
    const token = sessionStorage.getItem('token')
    await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters',
      {
        method: 'POST',
        body: formDataToSend,
        headers: { Authorization: 'Bearer ' + token },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters',
    )

    const data = await res.json()
    setPosters(data)
    setIsFormModalOpen(false)

    setPosters(data)
    setIsFormModalOpen(false)
  }

  const handleEdit = (poster) => {
    const yearFromTitle = poster.title.match(/\d{4}$/)?.[0] || ''
    setModalMode('edit')

    setSelectedItem({
      ...poster,
      title: "Fest'n Breizh",
      year: yearFromTitle,
      caption: poster.caption,
      media: poster.url,
    })
    setIsFormModalOpen(true)
  }

  const handleUpdatePoster = async (formData) => {
    const formDataToSend = new FormData()
    const posterData = {
      title: "Fest'n Breizh " + formData.year,
      year: formData.year,
      caption: formData.caption,
    }
    if (formData.media instanceof File) {
      formDataToSend.append('media', formData.media)
    }
    formDataToSend.append('poster', JSON.stringify(posterData))

    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters/${selectedItem._id}`,
      {
        method: 'PUT',
        body: formDataToSend,
        headers: { Authorization: 'Bearer ' + token },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters',
    )

    const data = await res.json()

    setPosters(data)
    setIsFormModalOpen(false)
  }

  const handleDeletePoster = async () => {
    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters/${selectedItem._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/gallery/posters',
    )

    const data = await res.json()

    setPosters(data)
    setIsFormModalOpen(false)
  }

  const handleSubmitModal = async (formData) => {
    if (modalMode === 'create') {
      handleCreatePoster(formData)
    } else if (modalMode === 'edit') {
      handleUpdatePoster(formData)
    } else if (modalMode === 'delete') {
      handleDeletePoster()
    }
  }

  return (
    <>
      <div className="page__title">
        <h1>les Affiches</h1>
        <p className="page__title--txt">
          voici les affiches de toutes les éditions de Fest'n Brezh depuis son
          Commencement en 2009. Cliquez sur l'affiche pour la voir en plus
          grand.
        </p>
      </div>
      {isEditing && (
        <button title="créé" className="button__create" onClick={handleCreate}>
          ajouter une nouvelle
          <br />
          affiche
        </button>
      )}

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
            {isEditing && (
              <div className="button__editposter">
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
            <h2 className="poster__title">
              {item.title.includes(item.year)
                ? item.title
                : item.title + ' ' + item.year}
            </h2>
            <img
              src={item.url}
              alt={`affiche ${item.title} ${item.year}`}
              className="poster__img"
            />
            <figcaption className="poster__caption">
              {item.caption && (
                <p className="poster__figcaption">&copy; {item.caption}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {isModalOpen && selectedPoster && (
        <div className="modal__poster" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal__poster--content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="modal__poster--close"
              onClick={() => setIsModalOpen(false)}
            >
              &#9746;
            </span>
            <img
              className="modal__poster--img"
              src={selectedPoster.url}
              alt={`affiche ${selectedPoster.title}`}
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
        entityName="une affiche"
      />
    </>
  )
}

export default Posters
