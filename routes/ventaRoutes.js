const express = require("express");
const router = express.Router();
const protegerRuta = require("../middleware/authMiddleware");
const {
  registrarVenta,
  obtenerVentas,
  buscarProductoPorCodigo,
  actividadReciente,
} = require("../controllers/ventaController");

router.get("/", protegerRuta, obtenerVentas);
router.get("/actividad", protegerRuta, actividadReciente);
router.get("/buscar/:codigo", protegerRuta, buscarProductoPorCodigo);
router.post("/", protegerRuta, registrarVenta);

module.exports = router;
