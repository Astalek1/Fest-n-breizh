import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json()); // permet de lire les données JSON envoyées au serveur
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*" // autorise les requêtes du frontend
}));

// Route test (healthcheck)
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "festn-breizh-api" });
});

//route test API
app.get("/test", (req,res) => {
  res.json({"message": "API Fest'n Breizh active "})
})

// Démarrage serveur
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});