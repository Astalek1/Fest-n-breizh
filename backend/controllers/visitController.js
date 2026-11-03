import Visit from '../models/Visit.js'

// Récupérer le nombre de visites
export const getVisits = async (req, res) => {
  try {
    let visit = await Visit.findOne()

    if (!visit) {
      visit = await Visit.create({ count: 0 })
    }

    res.status(200).json({ count: visit.count })
  } catch (error) {
    console.error('Erreur getVisits :', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Ajouter une visite
export const addVisit = async (req, res) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      {
        new: true,
        upsert: true,
      },
    )

    res.status(200).json({ count: visit.count })
  } catch (error) {
    console.error('Erreur addVisit :', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
