import { useEffect } from 'react'

function PingManager({ isEditing }) {
  useEffect(() => {
    let interval = null

    if (isEditing) {
      interval = setInterval(() => {
        const token = sessionStorage.getItem('token')

        if (!token) return

        fetch('https://fnb-backend.dokku.festnbreizh.bzh/api/auth/ping', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
          },
        })
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isEditing])

  return null
}

export default PingManager
