import express from 'express'
import auth from '../middleware/auth.js'
import multer from '../middleware/multer.js'
import * as videosCtrl from '../controllers/videos.js'

const router = express.Router()

router.get('/', videosCtrl.getAllVideos)
router.get('/:id', videosCtrl.getOneVideo)

router.post('/', auth, multer.none(), videosCtrl.newVideo)

router.put('/:id', auth, multer.none(), videosCtrl.updateVideo)

router.delete('/:id', auth, videosCtrl.deleteVideo)

export default router
