const express = require("express");
const router = express.Router();
const protegerRuta = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  crearReserva,
  subirComprobante,
  obtenerReservas,
  actualizarEstadoReserva,
  seguimientoReserva,
} = require("../controllers/reservaController");

router.post("/", crearReserva);
router.post("/:id/comprobante", upload.single("imagen"), subirComprobante);
router.get("/seguimiento", seguimientoReserva);
router.get("/", protegerRuta, obtenerReservas);
router.put("/:id/estado", protegerRuta, actualizarEstadoReserva);

module.exports = router;
