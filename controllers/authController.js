const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales invalidas" });
    }

    const passwordCorrecta = await usuario.compararPassword(password);
    if (!passwordCorrecta) {
      return res.status(401).json({ mensaje: "Credenciales invalidas" });
    }

    const token = generarToken(usuario._id);
    res.json({
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error del servidor", error: error.message });
  }
};

module.exports = { login };
