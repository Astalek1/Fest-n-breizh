import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const signup = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hash,
    });
    await user.save();
    res.status(201).json({ message: "Utilisateur créé !" });
  } catch (error) {
    if (error.code === 11000) {
      // Gestion user déjà utilisé
      return res.status(400).json({ error: "nom d'utilisateur déjà utilisé !" });
    }
    res.status(500).json({ error });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé !" });
    }

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect !" });
    }

    if (user.tokenActif) {
  return res.status(403).json({ error: "Utilisateur déjà connecté !" });
}
    const token = jwt.sign(
 
  { userId: user._id },
  process.env.TOKEN_SECRET,
  { expiresIn: "24h" }
    );
    user.tokenActif = token;
    
    await user.save();
    res.status(200).json({
  userId: user._id,
  token: token
});
 
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const logout = async (req, res) => {
  try {
    req.user.tokenActif = null;
    await req.user.save();
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ error: "Erreur de déconnexion" });
  }
};