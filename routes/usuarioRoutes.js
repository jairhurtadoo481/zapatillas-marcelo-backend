const express = require("express");
const router = express.Router();
const protegerRuta = require("../middleware/authMiddleware");
const { soloAdmin } = require("../middleware/authMiddleware");
const {
  crearTrabajador,
  obtenerTrabajadores,
  actualizarTrabajador,
  eliminarTrabajador,
} = require("../controllers/usuarioController");

router.get("/", protegerRuta, soloAdmin, obtenerTrabajadores);
router.post("/", protegerRuta, soloAdmin, crearTrabajador);
router.put("/:id", protegerRuta, soloAdmin, actualizarTrabajador);
router.delete("/:id", protegerRuta, soloAdmin, eliminarTrabajador);

module.exports = router;
