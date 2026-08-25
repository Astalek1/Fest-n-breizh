import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import dns from "node:dns";
import helmet from "helmet";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// import des routes
import userRoutes from "./routes/user.js";
import editionsRoutes from "./routes/editions.js";
import artistsRoutes from "./routes/artists.js";
import guestsRoutes from "./routes/guests.js";
import announcementsRoutes from "./routes/announcements.js";
import galleryRoutes from "./routes/gallery.js";
import videosRoutes from "./routes/videos.js";
import partnersRoutes from "./routes/partners.js";
import linksRoutes from "./routes/links.js";
import contactRoutes from "./routes/contact.js";
import filesRoutes from './routes/files.js';

dotenv.config();

const app = express();
app.use(helmet());

// Middlewares

app.use(express.json()) // permet de lire les données JSON envoyées au serveur

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CORS_ORIGIN,
]

app.use(
  cors({
    origin(origin, callback) {
      // Autorise les requêtes sans origine (Postman, curl...)
      if (!origin) {
        return callback(null, true)
      }

      // Autorise les origines de la liste
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origine non autorisée par CORS'))
    },
  }),
)

// Brancher les routes
app.use("/api/auth", userRoutes);
app.use("/api/editions", editionsRoutes);
app.use("/api/artists", artistsRoutes);
app.use("/api/guests", guestsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/files', filesRoutes)

// Route test (healthcheck)
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "festn-breizh-api" });
});

//route test API
app.get("/test", (req, res) => {
  res.json({ message: "API Fest'n Breizh active " });
});

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});
