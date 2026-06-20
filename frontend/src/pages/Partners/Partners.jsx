import './Partners.scss'
import { useState, useEffect } from 'react'
import Modal from '../../components/Modal/Modal'

function Partners({ isEditing }) {
  const [Partners, setPartners] = useState([])
  const [modalMode, setModalMode] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const fields = [
    { name: 'title', type: 'text', label: 'nom' },
    { name: 'text', type: 'textarea', label: 'déscription' },
    { name: 'logo', type: 'logo', label: 'logo' },
  ]

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/partners')
      .then((res) => res.json())
      .then((data) => setPartners(data))
      .catch((err) => console.error(err))
  }, [])

  const handleCreate = () => {
    setModalMode('create')

    setSelectedItem({
      title: '',
      text: '',
      logo: null,
      mediaType: 'logo',
    })

    setIsFormModalOpen(true)
  }

  const handleCreatePartner = async (formData) => {
    const formDataToSend = new FormData()

    if (formData.media) {
      formDataToSend.append('file', formData.media)
    }

    const partnerData = {
      name: formData.title,
      description: formData.text,
      file: formData.media, // ← IMPORTANT pour existing logo
    }

    formDataToSend.append('fileName', formData.title)
    formDataToSend.append('partner', JSON.stringify(partnerData))

    const token = sessionStorage.getItem('token')

    await fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/partners', {
      method: 'POST',
      body: formDataToSend,
      headers: { Authorization: 'Bearer ' + token },
    })

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/partners',
    )
    const data = await res.json()

    setPartners(data)
    setIsFormModalOpen(false)
  }

  const handleEdit = (partner) => {
    setModalMode('edit')

    setSelectedItem({
      _id: partner._id,
      title: partner.name,
      text: partner.description,
      media: partner.logo,
      mediaType: 'logo',
    })
    setIsFormModalOpen(true)
  }

  const handleUpdatePartner = async (formData) => {
    const formDataToSend = new FormData()

    const partnerData = {
      name: formData.title,
      description: formData.text,
    }

    // CAS 1 : upload fichier
    if (formData.media instanceof File) {
      formDataToSend.append('file', formData.media)
    }

    // CAS 2 : fileId ou URL
    else if (typeof formData.media === 'string') {
      partnerData.file = formData.media
    }

    formDataToSend.append('partner', JSON.stringify(partnerData))

    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/partners/${selectedItem._id}`,
      {
        method: 'PUT',
        body: formDataToSend,
        headers: { Authorization: 'Bearer ' + token },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/partners',
    )
    const data = await res.json()

    setPartners(data)
    setIsFormModalOpen(false)
  }

  const handleDeletePartner = async () => {
    const token = sessionStorage.getItem('token')

    await fetch(
      `https://fnb-backend.dokku.festnbreizh.bzh/api/partners/${selectedItem._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    )

    const res = await fetch(
      'https://fnb-backend.dokku.festnbreizh.bzh/api/partners',
    )

    const data = await res.json()

    setPartners(data)
    setIsFormModalOpen(false)
  }

  const handleSubmitModal = async (formData) => {
    if (modalMode === 'create') {
      handleCreatePartner(formData)
    } else if (modalMode === 'edit') {
      handleUpdatePartner(formData)
    } else if (modalMode === 'delete') {
      handleDeletePartner()
    }
  }

  return (
    <>
      <div className="partner__intro">
        <h1 className="partner__intro--title">La liste de nos partenaires.</h1>

        <p className="partner__intro--txt">
          Nos partenaires jouent un rôle essentiel dans la réalisation de nos
          projets. Par leur soutien, ils contribuent au développement du
          fest-noz et nous permettent de poursuivre nos actions tout au long de
          l'année.
          <br />
          <br /> Depuis nos débuts, certains nous accompagnent fidèlement et
          participent à l'évolution de nos événements année après année. Au fil
          du temps, de nouveaux partenaires nous ont également rejoints,
          apportant leur confiance, leurs compétences et leur soutien à nos
          actions. Cette diversité de collaborations constitue une véritable
          richesse et contribue à faire grandir nos projets.
          <br />
          <br /> Nous les remercions chaleureusement pour leur confiance, leur
          engagement et leur présence à nos côtés.
        </p>
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
      <div className="partners">
        {Partners.map((item) => (
          <article className="partners__content" key={item._id}>
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
            <h2 className="partners__title">{item.name}</h2>
            <p className="partners__txt">{item.description}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <img
                className="partners__logo"
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
        entityName="un partenaire"
      />
    </>
  )
}

export default Partners
