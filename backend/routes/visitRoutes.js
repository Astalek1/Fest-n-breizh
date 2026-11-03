import express from 'express'
import { getVisits, addVisit } from '../controllers/visitController.js'

const router = express.Router()

// Récupérer le nombre de visites
router.get('/', getVisits)

// Ajouter une visite
router.post('/', addVisit)

export default router
