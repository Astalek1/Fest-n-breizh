import multer from 'multer'

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true)
  else cb(new Error('Seules les images sont autorisées'), false)
}

const upload = multer({ storage, fileFilter })

// Export par défaut : l'objet multer (comme avant, pour compatibilité globale)
export default upload

// Export optionnel : middleware déjà configuré pour 1 fichier "media"
export const uploadSingle = upload.single('media')
