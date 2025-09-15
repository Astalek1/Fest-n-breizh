import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.js";


dotenv.config();

const app = express();

// Middlewares
app.use(express.json()); // permet de lire les données JSON envoyées au serveur
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*" // autorise les requêtes du frontend
}));

// Brancher les routes utilisateurs
app.use("/api/auth", userRoutes);

// Route test (healthcheck)
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "festn-breizh-api" });
});

//route test API
app.get("/test", (req,res) => {
  res.json({"message": "API Fest'n Breizh active "})
})

// Middleware 404 : route non trouvée
app.use((req, res, next) => {
  res.status(404).json({ error: "Route non trouvée (404)" });
});

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err.stack);
  res.status(500).json({ error: "Erreur serveur (500)" });
});


connectDB();

// Démarrage serveur
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});