//import './Editions.scss'
import { useParams, useNavigate } from 'react-router-dom'
function Editions() {
  const { editionId } = useParams()
  const navigate = useNavigate()

  const selectedEdition = editions.find((e) => e._id === editionId)

  return <> Les Editions</>
}

export default Editions
