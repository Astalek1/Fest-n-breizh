import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './MenuEdition.scss'

function MenuEdition({ editions, isEditing }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="MenuEdition">
      <button
        className={`MenuEdition__burger ${
          isMenuOpen ? 'MenuEdition__burger--open' : ''
        }`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        &#9776;
      </button>

      <div
        className={`MenuEdition__menu ${
          isMenuOpen ? 'MenuEdition__menu--open' : ''
        }`}
      >
        {editions.map((edition) => (
          <button
            className="MenuEdition__button"
            key={edition._id}
            onClick={() => {
              setIsMenuOpen(false)
              navigate(`/Editions/${edition._id}`)
            }}
          >
            <p className="MenuEdition__button--txt">{`${edition.title} ${edition.year}`}</p>
          </button>
        ))}

        {isEditing && (
          <button
            type="button"
            title="créer"
            className="MenuEdition__button--create"
            onClick={() => {
              navigate('/Editions/create')
            }}
          >
            Créer une édition
          </button>
        )}
      </div>
    </div>
  )
}
export default MenuEdition
