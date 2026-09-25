const express = require("express");
const router = express.Router();
const protegerRuta = require("../middleware/authMiddleware");
const { soloAdmin } = require("../middleware/authMiddleware");
const { requiereDesbloqueoFacturacion } = require("../middleware/facturacionMiddleware");
const uploadCert = require("../middleware/uploadCertMiddleware");
const {
  desbloquear,
  obtenerConfiguracion,
  guardarDatosEmpresa,
  guardarCredencialesSol,
  subirCertificado,
  buscarDocumento,
  guardarCliente,
  emitir,
  emitirNota,
  listarComprobantes,
} = require("../controllers/facturacionController");

const guardia = [protegerRuta, soloAdmin, requiereDesbloqueoFacturacion];

router.post("/desbloquear", protegerRuta, soloAdmin, desbloquear);

router.get("/configuracion", ...guardia, obtenerConfiguracion);
router.put("/configuracion/empresa", ...guardia, guardarDatosEmpresa);
router.put("/configuracion/credenciales-sol", ...guardia, guardarCredencialesSol);
router.post("/configuracion/certificado", ...guardia, uploadCert.single("certificado"), subirCertificado);
router.get("/documento/:tipo/:numero", ...guardia, buscarDocumento);
router.put("/clientes/:documento", ...guardia, guardarCliente);
router.post("/emitir", ...guardia, emitir);
router.post("/notas-credito", ...guardia, emitirNota);
router.get("/comprobantes", ...guardia, listarComprobantes);

module.exports = router;
