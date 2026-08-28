import Artist from '../models/Artists.js'
import Guest from '../models/Guests.js'
import Link from '../models/Links.js'
import Partner from '../models/Partners.js'
import Announcement from '../models/Announcements.js'
import Gallery from '../models/Gallery.js'

export const isFileInUse = async (fileId) => {
  console.log('isFileInUse check:', fileId)

  if (!fileId) return false

  const checks = await Promise.all([
    Artist.exists({ $or: [{ mediaFileId: fileId }, { logoFileId: fileId }] }),
    Guest.exists({ $or: [{ mediaFileId: fileId }, { logoFileId: fileId }] }),
    Link.exists({ logoFileId: fileId }),
    Partner.exists({ logoFileId: fileId }),
    Announcement.exists({
      $and: [{ mediaFileId: fileId }, { mediaType: 'logo' }],
    }),
    Gallery.exists({ mediaFileIdSmall: fileId }),
  ])
  console.log('isFileInUse results:', checks)

  return checks.some(Boolean)
}
