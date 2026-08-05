const jwt = require("jsonwebtoken");

const protegerRuta = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuarioId = decoded.id;
      next();
    } catch (error) {
      return res.status(401).json({ mensaje: "Token invalido o expirado" });
    }
  } else {
    return res.status(401).json({ mensaje: "No autorizado, falta token" });
  }
};

module.exports = protegerRuta;
