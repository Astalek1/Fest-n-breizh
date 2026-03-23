import './Login.scss'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ setIsEditing }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const handleSubmit = (e) => {
    e.preventDefault() // On empêche le rechargement de la page

    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Identifiants incorrects')
        }
        return response.json()
      })
      .then((data) => {
        console.log('Connexion réussie !', data)
        sessionStorage.setItem('token', data.token)
        setIsEditing(true)
        navigate('/')

        // Traitement en cas de succès
      })
      .catch((error) => {
        console.error('Erreur :', error.message)
        // Traitement de l'erreur
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
      </form>
    </>
  )
}

export default Login
