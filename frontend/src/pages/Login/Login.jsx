import './Login.scss'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ setIsEditing }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleBeforeUnload = () => {
      fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }) // si tu as besoin d’envoyer des cookies
        .then(() => {
          sessionStorage.clear()
        })
        .catch((err) => {
          console.error('Erreur lors de la déconnexion', err)
        })
    }

    window.addEventListener('beforeUnload', handleBeforeUnload)

    let timer
    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage('') // Efface le message après 5 secondes
      }, 5000)
    }
    return () => {
      window.removeEventListener('beforeUnload', handleBeforeUnload)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [errorMessage, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!username || !password) {
      setErrorMessage('Champs obligatoires')
      return
    }
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || 'Identifiants incorrects')
          })
        }
        return response.json()
      })
      .then((data) => {
        sessionStorage.setItem('token', data.token)
        setErrorMessage('')
        setIsEditing(true)
        navigate('/')
      })
      .catch((error) => {
        console.error('Erreur :', error.message)
        setErrorMessage(error.message)
      })
  }

  return (
    <>
      <h1 className="title">connexion</h1>
      <p className="txt">
        Cette section est réservée à l'équipe de Fest'n breizh.
      </p>

      <form className="formulaire__connexion" onSubmit={handleSubmit}>
        <label htmlFor="username" className="formulaire__connexion--label">
          Nom d'utilisateur :
        </label>
        <input
          id="username"
          className="formulaire__connexion--user"
          type="text"
          name="username"
          placeholder="nom de l'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
        />
        <label htmlFor="password" className="formulaire__connexion--label">
          Password :
        </label>
        <input
          id="password"
          className="formulaire__connexion--login"
          type="text"
          name="password"
          placeholder="mots de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="formulaire__connexion--button">
          Connexion
        </button>

        {errorMessage && (
          <div className="formulaire__connexion--txt">
            <p>{errorMessage}</p>
          </div>
        )}
      </form>
    </>
  )
}

export default Login
