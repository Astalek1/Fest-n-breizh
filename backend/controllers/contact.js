import transporter from "../config/mailer.js";

export const sendContact = async (req, res) => {
  const { name, email,subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }


  const allowedSubjects = [
    "Demande d'information",
    "Contact artistes",
    "Bénévolat",
    "Partenariat"
  ];

  if (!allowedSubjects.includes(subject)) {
  return res.status(400).json({ error: "Sujet invalide." });
}

  try {
    await transporter.sendMail({
      from: `"Formulaire Fest'n Breizh" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: process.env.CONTACT_EMAIL,
      subject: subject,
      text: `
Nom : ${name}
Email : ${email}

Message :
${message}
      `,
    });

    return res.status(200).json({
      message: "Message envoyé avec succès",
    });

  } catch (error) {
    console.error("Erreur SMTP :", error);
    return res.status(500).json({
      error: "Erreur lors de l'envoi du message",
    });
  }
};