import imagekit from '../config/imageKit.js'

export const resolveMedia = async (media, file, folder, cleanName) => {
  console.log('DEBUG resolveMedia input:', {
    hasFile: !!file,
    hasBuffer: !!file?.buffer,
    folder,
    cleanName,
  })
  try {
    // 0. Si le fichier contient déjà une URL (cas déjà uploadé / traité)
    if (file?.url && file?.fileId) {
      return {
        url: file.url,
        urlSmall: file.urlSmall || null,
        fileId: file.fileId,
        fileIdSmall: file.fileIdSmall || null,
      }
    }
    // 1. Si c’est une URL directe (non upload)
    if (typeof media === 'string') {
      try {
        new URL(media)
        return {
          url: media,
          urlSmall: null,
          fileId: null,
          fileIdSmall: null,
        }
      } catch {
        // Pas une URL valide → on continue
      }
    }

    // 2. Upload depuis Sharp (req.file)
    if (file && (file.buffer || file.bufferSmall || file.bufferLarge)) {
      const timestamp = Date.now()

      // Dossiers avec double version (small + large)
      const dualVersionFolders = [
        'festn_breizh/affiches',
        'festn_breizh/photos',
      ]

      // Si Sharp a généré deux versions ET que le dossier le demande
      if (
        file.bufferSmall &&
        file.bufferLarge &&
        dualVersionFolders.includes(folder)
      ) {
        const [smallUpload, largeUpload] = await Promise.all([
          imagekit.upload({
            file: file.bufferSmall.toString('base64'),
            fileName: `${cleanName}-small-${timestamp}.webp`,
            folder,
          }),
          imagekit.upload({
            file: file.bufferLarge.toString('base64'),
            fileName: `${cleanName}-large-${timestamp}.webp`,
            folder,
          }),
        ])

        return {
          url: largeUpload.url,
          urlSmall: smallUpload.url,
          fileId: largeUpload.fileId,
          fileIdSmall: smallUpload.fileId,
        }
      }

      // Cas standard (artistes, invités, annonces, partenaires, etc.)
      const buffer = file.bufferLarge || file.bufferSmall || file.buffer || null
      if (buffer) {
        const upload = await imagekit.upload({
          file: buffer.toString('base64'),
          fileName: `${cleanName}-${timestamp}.webp`,
          folder,
        })

        return {
          url: upload.url,
          urlSmall: null,
          fileId: upload.fileId,
          fileIdSmall: null,
        }
      }
    }

    // 3. Rien d’exploitable
    return {
      url: null,
      urlSmall: null,
      fileId: null,
      fileIdSmall: null,
    }
  } catch (error) {
    console.error('Erreur resolveMedia:', error)
    throw error
  }
}
