const Usuario = require("../models/Usuario");

const crearTrabajador = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Nombre, email y password son obligatorios" });
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ mensaje: "Ya existe una cuenta con ese email" });
    }

    const trabajador = new Usuario({ nombre, email, password, rol: "trabajador" });
    await trabajador.save();

    res.status(201).json({
      id: trabajador._id,
      nombre: trabajador.nombre,
      email: trabajador.email,
      rol: trabajador.rol,
      activo: trabajador.activo,
    });
  } catch (error) {
    res.status(400).json({ mensaje: "Error al crear trabajador", error: error.message });
  }
};

const obtenerTrabajadores = async (req, res) => {
  try {
    const trabajadores = await Usuario.find({ rol: "trabajador" }).select("-password");
    res.json(trabajadores);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener trabajadores", error: error.message });
  }
};

const actualizarTrabajador = async (req, res) => {
  try {
    const { nombre, email, password, activo } = req.body;
    const trabajador = await Usuario.findOne({ _id: req.params.id, rol: "trabajador" });

    if (!trabajador) {
      return res.status(404).json({ mensaje: "Trabajador no encontrado" });
    }

    if (nombre) trabajador.nombre = nombre;
    if (email) trabajador.email = email;
    if (password) trabajador.password = password;
    if (typeof activo === "boolean") trabajador.activo = activo;

    await trabajador.save();

    res.json({
      id: trabajador._id,
      nombre: trabajador.nombre,
      email: trabajador.email,
      rol: trabajador.rol,
      activo: trabajador.activo,
    });
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar trabajador", error: error.message });
  }
};

const eliminarTrabajador = async (req, res) => {
  try {
    const trabajador = await Usuario.findOneAndDelete({ _id: req.params.id, rol: "trabajador" });
    if (!trabajador) {
      return res.status(404).json({ mensaje: "Trabajador no encontrado" });
    }
    res.json({ mensaje: "Trabajador eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar trabajador", error: error.message });
  }
};

module.exports = {
  crearTrabajador,
  obtenerTrabajadores,
  actualizarTrabajador,
  eliminarTrabajador,
};
