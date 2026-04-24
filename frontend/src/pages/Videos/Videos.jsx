import './Videos.scss'
import { useState, useEffect } from 'react'
import Modal from '../../components/Modal/Modal'

function Videos({ isEditing }) {
  const [videos, setVideos] = useState([])
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
    { name: 'text', type: 'text', label: 'description', required: true },
  ]

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/videos')
      .then((res) => res.json())
      .then((data) => setVideos(data))
      .catch((err) => console.error(err))
  }, [])

  const handleCreate = () => {
    setModalMode('create')

    setSelectedItem({
      title: '',
      text: '',
      media: '',
      mediaType: 'video',
      mediaFile: undefined,
    })

    setIsFormModalOpen(true)
  }

  const handleCreateVideo = async (formData) => {
    const videoData = {
      title: formData.title,
      description: formData.text,
      url: formData.media,
    }

    const token = sessionStorage.getItem('token')

    await fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/videos', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData),
    })

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/videos',
    )

    const data = await res.json()

    setVideos(data)
    setIsFormModalOpen(false)
  }

  const handleEdit = (video) => {
    setModalMode('edit')

    setSelectedItem({
      _id: video._id,
      title: video.title,
      text: video.description,
      media: video.url,
      mediaType: 'video',
    })
    setIsFormModalOpen(true)
  }

  const handleUpdateVideo = async (formData) => {
    const videoData = {
      title: formData.title,
      description: formData.text,
      url: formData.media,
    }

    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/videos/${selectedItem._id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData),
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/videos',
    )
    const data = await res.json()
    setVideos(data)
    setIsFormModalOpen(false)
  }

  const handleDeleteVideo = async () => {
    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/videos/${selectedItem._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/videos',
    )
    const data = await res.json()
    setVideos(data)
    setIsFormModalOpen(false)
  }

  const handleSubmitModal = async (formData) => {
    if (modalMode === 'create') {
      handleCreateVideo(formData)
    } else if (modalMode === 'edit') {
      handleUpdateVideo(formData)
    } else if (modalMode === 'delete') {
      handleDeleteVideo()
    }
  }

  return (
    <>
      <div className="video__intro">
        <h1 className="video__intro--title">Nos vidéo sur Youtube</h1>
        {isEditing && (
          <button
            title="créé"
            className="button__create"
            onClick={handleCreate}
          >
            ajouter une nouvelle
            <br />
            vidéo
          </button>
        )}

        <p className="video__intro--txt">
          Fest’n Breizh, c’est aussi une diffusion de la musique bretonne hors
          des parquets !<br /> À travers deux formats, notre association diffuse
          sur les principales plateformes internet un échantillon de cet univers
          musical riche.
          <br /> Des digressions musicales d’abord donnent la parole aux
          artistes et musiciens, et cela passe aussi par le partage de leur
          culture commune, leurs inspirations parfois surprenantes et leur
          rapport au public.
          <br /> Ensuite, des captures de vidéos live donnent à voir les
          performances des artistes que nous programmons, nous et nos
          partenaires, et cela chaque année. <br />
          Transmettre cette culture hors de la scène est pour nous une mission
          d’importance pour populariser la musique à danser auprès d’un public
          de curieux qui ne foulent pas toujours le plancher.
          <br />
          <br />
          cette page vous propose un échantillon de nos vidéos.
          <br /> vous pouvez retrouver l'ensemble de notre contenu sur notre
          chaîne YouTube
        </p>
        <a
          href="https://www.youtube.com/@festnbreizh2300"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/logo-youtube-1770820920343_O4sGrxN1J.webp"
            className="video__intro--logo"
            alt="logo youtube"
          />
        </a>
      </div>
      <div className="videos">
        {videos.map((item) => (
          <article className="videos__content" key={item._id}>
            <h2 className="videos__title">{item.title}</h2>
            {isEditing && (
              <div className="button__edit">
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
            <p className="videos__txt">{item.description}</p>

            <iframe
              className="videos__windows"
              src={`https://www.youtube.com/embed/${
                item.url.split('v=')[1]?.split('&')[0] ||
                item.url.split('youtu.be/')[1]?.split('?')[0]
              }`}
              title={item.title}
              allowFullScreen
            />
          </article>
        ))}
      </div>
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={modalMode}
        fields={fields}
        onSubmit={handleSubmitModal}
        data={selectedItem}
        entityName="une vidéo"
      />
    </>
  )
}

export default Videos
