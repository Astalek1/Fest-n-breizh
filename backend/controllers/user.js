import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const signup = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hash,
    });
    await user.save();
    res.status(201).json({ message: "Utilisateur créé !" });
  } catch (error) {
    if (error.code === 11000) {
      // Gestion email déjà utilisé
      return res.status(400).json({ error: "Email déjà utilisé !" });
    }
    res.status(500).json({ error });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé !" });
    }

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect !" });
    }

    res.status(200).json({
      userId: user._id,
      token: jwt.sign(
        { userId: user._id },
        process.env.TOKEN_SECRET,
        { expiresIn: "24h" }
      ),
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};
