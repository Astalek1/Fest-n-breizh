import Edition from "../models/Editions"
import imageKit from "../config/imageKit"

export const creatEdition = async (req, res) => {
    try{
        const editionData = JSON.parse(req.body.edition)
        const cleanTitle = editionData.title.replace(/\s+/g, "-").toLowerCase();
        const afficheUpload = await imageKit.upload({
            file: req.file.buffer.toString("base64"),
            fileName: `affiche-${cleanTitle}-${Date.now()}.webp`,
            folder: "/fest_breizh/affiches"
        });
        const newEdition = new Edition({
            title: editionData.title,
            affiche: afficheUpload.url,
            invites: editionData.invites
        });
        await newEdition.save();
        res.status(201).json({ message: "Édition créée avec succès !" });
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};