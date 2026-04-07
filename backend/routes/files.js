import express from 'express'
import imagekit from '../config/imageKit.js'

const router = express.Router()

router.get('/logos', async (req, res) => {
  try {
    const files = await imagekit.listFiles({
      path: '/festn_breizh/logos/',
    })

    const logos = files.map((file) => ({
      fileId: file.fileId,
      name: file.name,
      url: file.url,
    }))

    res.json(logos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erreur récupération logos' })
  }
})

export default router