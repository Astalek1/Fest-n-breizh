import './Login.scss'
import { useState } from 'react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <>
      <h1 className="title">connexion</h1>
      <p className="txt">
        Cette section est réservée à l'équipe de Fest'n breizh.
      </p>

      <form
        className="formulaire__connexion"
        onSubmit={(e) => e.preventDefault()}
      >
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
