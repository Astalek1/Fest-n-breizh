import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
import Link from "../models/Links.js";
import Partner from "../models/Partners.js";
import Announcement from "../models/Announcements.js";

export const isFileInUse = async (fileId) => {
  if (!fileId) return false;

  const checks = await Promise.all([
    Artist.exists({ $or: [{ mediaFileId: fileId }, { logoFileId: fileId }] }),
    Guest.exists({ $or: [{ mediaFileId: fileId }, { logoFileId: fileId }] }),
    Link.exists({ logoFileId: fileId }),
    Partner.exists({ logoFileId: fileId }),
    Announcement.exists({
      $and: [{ mediaFileId: fileId }, { mediaType: "logo" }],
    }),
  ]);

  return checks.some(Boolean);
};
