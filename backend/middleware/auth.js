import jwt, { verify } from "jsonwebtoken";

export default (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; //recupoération du token//
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET); //verification du token avec la clé//
    const userId = decodedToken.userId;

    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
