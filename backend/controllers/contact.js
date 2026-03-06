export const sendContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // ici viendra l'envoi d'email (Nodemailer)

    return res.status(200).json({
      message: "Message envoyé avec succès",
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erreur lors de l'envoi du message",
    });
  }
};