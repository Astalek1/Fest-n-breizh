import './Contact.scss'
import { useState } from 'react'

function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState("Demande d'information")
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(
        'https://fnb-backend.dokku.festnbreizh.bzh/api/contact',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message }),
        },
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi.")
      }

      setSuccess('Message envoyé avec succès.')
      setName('')
      setEmail('')
      setSubject("Demande d'information")
      setMessage('')
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    }
  }

  return (
    <section className="contact">
      <h1 className="contact__title">Contact</h1>
      <p className="contact__txt">texte a venir</p>

      <form onSubmit={handleSubmit} className="contact__form">
        <input
          type="text"
          placeholder="Nom / Prénom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option>Demande d'information</option>
          <option>Contact artistes</option>
          <option>Bénévolat</option>
          <option>Partenariat</option>
        </select>

        <textarea
          placeholder="Votre message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <button type="submit">Envoyer</button>

        {error && <div className="contact__error">{error}</div>}
        {success && <div className="contact__success">{success}</div>}
      </form>
    </section>
  )
}

export default Contact
