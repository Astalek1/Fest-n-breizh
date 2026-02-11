import './Links.scss'

import { useState, useEffect } from 'react'

function Links() {
  const [links, setlinks] = useState([])

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/links')
      .then((res) => res.json())
      .then((data) => setlinks(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <>
      <div className="link__intro">
        <h1 className="link__intro--title">nos plateformes et réseaux.</h1>

        <p className="link__intro--txt">texte a venir.</p>
      </div>
      <div className="links">
        {links.map((item) => (
          <article className="links__content" key={item._id}>
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
    </>
  )
}

export default Links
