const express = require("express");
const router = express.Router();
const protegerRuta = require("../middleware/authMiddleware");
const {
  crearReserva,
  obtenerReservas,
  actualizarEstadoReserva,
} = require("../controllers/reservaController");

router.post("/", crearReserva);
router.get("/", protegerRuta, obtenerReservas);
router.put("/:id/estado", protegerRuta, actualizarEstadoReserva);

module.exports = router;
