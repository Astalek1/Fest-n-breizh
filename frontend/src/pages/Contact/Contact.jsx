import './Contact.scss'
import { useState, useRef, useEffect } from 'react'

function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState("Demande d'information")
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError(null)
    setSuccess(null)

    //Nettoie un ancien timeout s’il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

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

      timeoutRef.current = setTimeout(() => {
        setSuccess(null)
      }, 5000)

      setName('')
      setEmail('')
      setSubject("Demande d'information")
      setMessage('')
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')

      timeoutRef.current = setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }

  return (
    <section className="contact">
      <h1 className="contact__title">Contact</h1>
      <p className="contact__txt">
        Pour toute demande d'information ou pour tout autre sujet ( prise de
        contact artistes, demande de bénévolat ou de partenariat), vous pouvez
        nous envoyer un mail:
        <br /> Soit grâce au formulaire suivant ou directement à cette adresse :
        contact@festnbreizh.bzh
      </p>

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
