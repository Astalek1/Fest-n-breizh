import './Links.scss'
import Modal from '../../components/Modal/Modal'
import { useState, useEffect } from 'react'

function Links({ isEditing }) {
  const [links, setLinks] = useState([])
  const [modalMode, setModalMode] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const fields = [
    { name: 'title', type: 'text', label: 'nom' },
    { name: 'text', type: 'textarea', label: 'déscription' },
    { name: 'url', type: 'text', label: 'URL', required: true },
    { name: 'logo', type: 'logo', label: 'logo' },
  ]

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/links')
      .then((res) => res.json())
      .then((data) => setLinks(data))
      .catch((err) => console.error(err))
  }, [])

  const handleCreate = () => {
    setModalMode('create')

    setSelectedItem({
      title: '',
      text: '',
      logo: null,
      url: '',
      mediaType: 'logo',
    })

    setIsFormModalOpen(true)
  }

  const handleCreateLink = async (formData) => {
    const formDataToSend = new FormData()

    if (formData.media) {
      formDataToSend.append('file', formData.media)
    }

    const linkData = {
      name: formData.title,
      description: formData.text,
      url: formData.url,
      file: formData.media, // ← IMPORTANT pour existing logo
    }

    formDataToSend.append('fileName', formData.title) //  FIX
    formDataToSend.append('link', JSON.stringify(linkData))

    const token = sessionStorage.getItem('token')

    await fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/links', {
      method: 'POST',
      body: formDataToSend,
      headers: { Authorization: 'Bearer ' + token },
    })

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/links',
    )
    const data = await res.json()

    setLinks(data)
    setIsFormModalOpen(false)
  }

  const handleEdit = (link) => {
    setModalMode('edit')

    setSelectedItem({
      _id: link._id,
      title: link.name,
      text: link.description,
      media: link.logo,
      url: link.url,
      mediaType: 'logo',
    })
    setIsFormModalOpen(true)
  }

  const handleUpdateLink = async (formData) => {
    const formDataToSend = new FormData()

    const linkData = {
      name: formData.title,
      description: formData.text,
      url: formData.url,
    }

    // CAS 1 : upload fichier
    if (formData.media instanceof File) {
      formDataToSend.append('file', formData.media)
    }

    // CAS 2 : fileId ou URL
    else if (typeof formData.media === 'string') {
      linkData.file = formData.media
    }

    formDataToSend.append('link', JSON.stringify(linkData))

    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/links/${selectedItem._id}`,
      {
        method: 'PUT',
        body: formDataToSend,
        headers: { Authorization: 'Bearer ' + token },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/links',
    )
    const data = await res.json()

    setLinks(data)
    setIsFormModalOpen(false)
  }

  const handleDeleteLink = async () => {
    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/links/${selectedItem._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/links',
    )

    const data = await res.json()

    setLinks(data)
    setIsFormModalOpen(false)
  }

  const handleSubmitModal = async (formData) => {
    if (modalMode === 'create') {
      handleCreateLink(formData)
    } else if (modalMode === 'edit') {
      handleUpdateLink(formData)
    } else if (modalMode === 'delete') {
      handleDeleteLink()
    }
  }

  return (
    <>
      <div className="link__intro">
        <h1 className="link__intro--title">nos plateformes et réseaux.</h1>

        <p className="link__intro--txt">texte a venir.</p>

        {isEditing && (
          <button
            title="créé"
            className="button__create"
            onClick={handleCreate}
          >
            ajouter une nouvelle
            <br />
            affiche
          </button>
        )}
      </div>
      <div className="links">
        {links.map((item) => (
          <article className="links__content" key={item._id}>
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
            <h2 className="links__title">{item.name}</h2>
            <p className="links__txt">{item.description}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <img
                className="links__logo"
                src={item.logo}
                alt={`logo ${item.name}`}
              />
            </a>
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
        entityName="un réseau"
      />
    </>
  )
}

export default Links
