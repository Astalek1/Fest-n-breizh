import { useNavigate } from 'react-router-dom'
import './MenuEdition.scss'
function MenuEdition({ editions, isEditing }) {
  const navigate = useNavigate()

  return (
    <div className="MenuEdition">
      <button className="MenuEdition__burger">&#9776;</button>

      <div className="MenuEdition__menu">
        {editions.map((edition) => (
          <button
            className="MenuEdition__button"
            key={edition._id}
            onClick={() => navigate(`/Editions/${edition._id}`)}
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
