import './Login.scss'

function Login() {
  return (
    <>
      <h1 className="title">connexion</h1>
      <p className="txt">
        Cette section est réservée à l'équipe de Fest'n breizh.
      </p>

      <form className="formulaire__connexion">
        <label htmlFor="username" className="formulaire__connexion--label">
          Nom d'utilisateur :
        </label>
        <input
          id="username"
          className="formulaire__connexion--user"
          type="text"
          name="username"
          placeholder="nom de l'utilisateur"
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
        />

        <button type="submit" className="formulaire__connexion--button">
          Connexion
        </button>
      </form>
    </>
  )
}

export default Login
