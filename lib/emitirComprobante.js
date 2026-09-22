const FacturacionConfig = require("../models/FacturacionConfig");
const Comprobante = require("../models/Comprobante");
const Cliente = require("../models/Cliente");
const { descifrar } = require("../config/cifrado");
const { leerCertificadoP12 } = require("./certificado");
const { generarXmlComprobante } = require("./ubl");
const { firmarXml } = require("./firmarXml");
const { crearZipComprobante } = require("./zip");
const { enviarComprobante } = require("./soapSunat");
const { generarPdfComprobante } = require("./pdfComprobante");
const { montoALetras } = require("./montoALetras");
const { calcularTotales } = require("./calculosComprobante");
const { subirArchivo } = require("../config/cloudinaryUpload");

const TIPO_COMPROBANTE_CODE = { factura: "01", boleta: "03" };

const obtenerSiguienteCorrelativo = async (tipo) => {
  const campo = `correlativos.${tipo}`;
  const config = await FacturacionConfig.findOneAndUpdate(
    {},
    { $inc: { [campo]: 1 } },
    { new: true, upsert: true }
  );
  return config.correlativos[tipo];
};

const guardarClienteSiNoExiste = async (cliente) => {
  const camposActualizados = { nombre: cliente.nombre, direccion: cliente.direccion || "" };
  if (cliente.telefono) camposActualizados.telefono = cliente.telefono;
  if (cliente.correo) camposActualizados.correo = cliente.correo;
  if (cliente.contacto) camposActualizados.contacto = cliente.contacto;
  if (cliente.referencia) camposActualizados.referencia = cliente.referencia;

  await Cliente.findOneAndUpdate(
    { documento: cliente.documento },
    {
      $setOnInsert: { tipoDocumento: cliente.tipoDocumento },
      $set: camposActualizados,
    },
    { upsert: true }
  );
};

const emitirComprobante = async ({ tipo, cliente, items }) => {
  const config = await FacturacionConfig.findOne();
  if (!config || !config.certificadoCifrado || !config.usuarioSolCifrado) {
    throw new Error("La configuracion de facturacion no esta completa (falta certificado o credenciales SOL)");
  }

  const usuarioSol = descifrar(config.usuarioSolCifrado).toString("utf8");
  const claveSol = descifrar(config.claveSolCifrada).toString("utf8");
  const bufferCert = descifrar(config.certificadoCifrado);
  const claveCert = descifrar(config.claveCertificadoCifrada).toString("utf8");
  const { clavePrivadaPem, certificadoPem } = leerCertificadoP12(bufferCert, claveCert);

  const serie = config.series[tipo];
  const correlativo = await obtenerSiguienteCorrelativo(tipo);
  const tipoCode = TIPO_COMPROBANTE_CODE[tipo];
  const nombreArchivo = `${config.ruc}-${tipoCode}-${serie}-${correlativo}`;

  const ahora = new Date();
  const fechaEmision = ahora.toISOString().slice(0, 10);
  const horaEmision = ahora.toTimeString().slice(0, 8);

  const emisor = {
    ruc: config.ruc,
    razonSocial: config.razonSocial,
    nombreComercial: config.nombreComercial,
    direccion: config.direccion,
  };

  const xml = generarXmlComprobante({ tipo, serie, correlativo, fechaEmision, horaEmision, emisor, cliente, items });
  const xmlFirmado = firmarXml(xml, clavePrivadaPem, certificadoPem);
  const zipBuffer = await crearZipComprobante(nombreArchivo, xmlFirmado);

  const { subtotal, igv, total } = calcularTotales(items);

  const comprobante = new Comprobante({
    tipo,
    serie,
    correlativo,
    cliente,
    items,
    subtotal,
    igv,
    total,
    ambiente: config.ambiente,
    estado: "pendiente",
  });

  try {
    const resultado = await enviarComprobante({
      ambiente: config.ambiente,
      ruc: config.ruc,
      usuarioSol,
      claveSol,
      nombreArchivo,
      zipBuffer,
    });

    if (resultado.ok) {
      comprobante.estado = resultado.codigo === "0" ? "aceptado" : "rechazado";
      comprobante.codigoHash = resultado.codigo;
      comprobante.observaciones = resultado.descripcion;

      const cdrSubido = await subirArchivo(Buffer.from(resultado.zipCdrBase64, "base64"), "zapatillas-marcelo/facturacion/cdr", `R-${nombreArchivo}`);
      comprobante.cdrUrl = cdrSubido.secure_url;
    } else {
      comprobante.estado = "error";
      comprobante.observaciones = resultado.faultstring || "Error desconocido al enviar a SUNAT";
    }
  } catch (error) {
    comprobante.estado = "error";
    const detalle = error.name === "TimeoutError"
      ? "SUNAT no respondio a tiempo (25s). Su servicio Beta puede estar caido, intenta de nuevo en unos minutos."
      : error.cause?.message || error.message;
    comprobante.observaciones = `Error de conexion con SUNAT: ${detalle}`;
  }

  const xmlSubido = await subirArchivo(Buffer.from(xmlFirmado, "utf8"), "zapatillas-marcelo/facturacion/xml", nombreArchivo);
  comprobante.xmlUrl = xmlSubido.secure_url;

  const pdfBuffer = await generarPdfComprobante(
    { ...comprobante.toObject(), fechaEmision, montoEnLetras: montoALetras(total, "PEN") },
    emisor
  );
  const pdfSubido = await subirArchivo(pdfBuffer, "zapatillas-marcelo/facturacion/pdf", nombreArchivo);
  comprobante.pdfUrl = pdfSubido.secure_url;

  await comprobante.save();
  await guardarClienteSiNoExiste(cliente);

  return comprobante;
};

module.exports = { emitirComprobante };
