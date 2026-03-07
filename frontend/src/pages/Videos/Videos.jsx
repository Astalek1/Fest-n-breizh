import './Videos.scss'
import { useState, useEffect } from 'react'

function Videos() {
  const [videos, setvideos] = useState([])

  useEffect(() => {
    fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/videos')
      .then((res) => res.json())
      .then((data) => setvideos(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <>
      <div className="video__intro">
        <h1 className="video__intro--title">Nos vidéo sur Youtube</h1>

        <p className="video__intro--txt">
          Fest’n Breizh, c’est aussi une diffusion de la musique bretonne hors
          des parquets !<br /> À travers deux formats, notre association diffuse
          sur les principales plateformes internet un échantillon de cet univers
          musical riche.
          <br /> Des digressions musicales d’abord donnent la parole aux
          artistes et musiciens, et cela passe aussi par le partage de leur
          culture commune, leurs inspirations parfois surprenantes et leur
          rapport au public.
          <br /> Ensuite, des captures de vidéos live donnent à voir les
          performances des artistes que nous programmons, nous et nos
          partenaires, et cela chaque année. <br />
          Transmettre cette culture hors de la scène est pour nous une mission
          d’importance pour populariser la musique à danser auprès d’un public
          de curieux qui ne foulent pas toujours le plancher.
          <br />
          <br />
          cette page vous propose un échantillon de nos vidéos.
          <br /> vous pouvez retrouver l'ensemble de notre contenu sur notre
          chaîne YouTube
        </p>
        <a
          href="https://www.youtube.com/@festnbreizh2300"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://ik.imagekit.io/tzek55xr2j/festn_breizh/logos/logo-youtube-1770820920343_O4sGrxN1J.webp?updatedAt=1770820921179"
            className="video__intro--logo"
            alt="logo youtube"
          />
        </a>
      </div>
      <div className="videos">
        {videos.map((item) => (
          <article className="videos__content" key={item._id}>
            <h2 className="videos__title">{item.title}</h2>
            <p className="videos__txt">{item.description}</p>

            <iframe
              className="videos__windows"
              src={item.url.replace('watch?v=', 'embed/')}
              title={item.title}
              allowFullScreen
            />
          </article>
        ))}
      </div>
    </>
  )
}

export default Videos
