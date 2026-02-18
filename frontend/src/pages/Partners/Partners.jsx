import './Partners.scss'

import { useState, useEffect } from 'react'

function Partners() {
  const [Partners, setPartners] = useState([])

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/partners')
      .then((res) => res.json())
      .then((data) => setPartners(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <>
      <div className="partner__intro">
        <h1 className="partner__intro--title">La liste de nos partenaires.</h1>

        <p className="partner__intro--txt">texte a venir.</p>
      </div>
      <div className="partners">
        {Partners.map((item) => (
          <article className="partners__content" key={item._id}>
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
    </>
  )
}

export default Partners
