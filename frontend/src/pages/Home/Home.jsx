import { useState, useEffect } from 'react'
import './Home.scss'

function Home() {
  const carouselImages = [
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-1.webp?updatedAt=1765968510369',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-2.webp?updatedAt=1765968510579',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-3.webp?updatedAt=1765968510551',
    'https://ik.imagekit.io/tzek55xr2j/festn_breizh/permanents/carousel-4.webp?updatedAt=1765968510586',
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselImages.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [carouselImages.length])

  return (
    <div className="home">
      <div className="slidshow">
        <div
          className="slidshow__img"
          style={{ backgroundImage: `url(${carouselImages[index]})` }}
        ></div>

        <div className="slidshow__overlay"></div>

        <div className="slidshow__text">
          <div className="slidshow__text">
            <span className="slidshow__title">Fest’n Breizh </span>
            vous souhaite la bienvenue !
          </div>
        </div>
      </div>

      <div className="announcements"></div>
    </div>
  )
}

export default Home
