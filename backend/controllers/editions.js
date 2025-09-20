import Edition from "../models/Editions"
import imagekit from "../config/imageKit"

//créé une nouvelle edition//
export const createEdition = async (req, res) => {
    try{
        const editionData = JSON.parse(req.body.edition)
        const cleanTitle = editionData.title.replace(/\s+/g, "-").toLowerCase();
        const afficheUpload = await imagekit.upload({
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

// trouvé toute les éditions//
export const getAllEditions = async (req, res) => {
    try{
        const editions = await Edition.find();
        res.status(200).json(editions);
    }catch(error) {
        res.status(500).json("Erreur serveur, base de données inaccessible");
    }
};

//trouvé une seul édition//
export const getOneEdition = async (req, res) => {
    try{
        const edition = await Edition.findById(req.params.id);
        if(!edition){return res.status(404).json("édition non trouvée")};
        res.status(200).json(edition);
    }catch(error) {
        res.status(500).json("Erreur serveur, base de données inaccessible");
    }
};

//modifié une édition//
export const updateEdition = async (req, res) => {
  try {
        const allowedFields = ["title", "affiche", "invites", "artistes"];

        // On filtre req.body pour ne garder que ceux de la liste//
        const filteredData = {};
        for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            filteredData[field] = req.body[field];
        }
        };

        const newDataEdition = await Edition.findByIdAndUpdate(
        req.params.id,
        filteredData,
        { new: true, runValidators: true }
        );

        if (!newDataEdition) {
        return res.status(404).json("Édition non trouvée");
        }

        res.status(200).json(newDataEdition);
    } catch (error) {
        res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//suprimé une édition//
export const deleteEdition = async (req, res) => {
    try{
        const edition = await Edition.findByIdAndDelete(req.params.id);
        if(!edition){return res.status(404).json("édition non trouvée")};
        res.status(200).json("Edition suprimée")
    }catch (error){
        res.status(500).json("Erreur serveur, base de données inaccessible");
    }
};
