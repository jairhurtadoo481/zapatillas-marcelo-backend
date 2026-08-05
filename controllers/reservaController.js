const Reserva = require("../models/Reserva");
const Producto = require("../models/Producto");

const obtenerSiguienteNumero = async () => {
  const ultima = await Reserva.findOne({ numero: { $exists: true, $type: "number" } }).sort({ numero: -1 });
  return ultima ? ultima.numero + 1 : 1001;
};

const crearReserva = async (req, res) => {
  try {
    const { items, cliente } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ mensaje: "La reserva debe tener al menos un producto" });
    }

    if (!cliente || !cliente.nombre || !cliente.celular || !cliente.ciudad) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios del cliente" });
    }

    if (cliente.entregaDomicilio && !cliente.direccion) {
      return res.status(400).json({ mensaje: "Falta la direccion para la entrega a domicilio" });
    }

    let total = 0;
    let requierePagoCompleto = false;
    const itemsProcesados = [];

    for (const item of items) {
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto no encontrado: ${item.producto}` });
      }

      const ahora = new Date();
      const ofertaActiva =
        producto.precioOferta !== null &&
        producto.precioOferta !== undefined &&
        producto.ofertaInicio &&
        producto.ofertaFin &&
        ahora >= new Date(producto.ofertaInicio) &&
        ahora <= new Date(producto.ofertaFin);

      const precioUnitario = ofertaActiva ? producto.precioOferta : producto.precio;

      if (ofertaActiva) requierePagoCompleto = true;

      total += precioUnitario * item.cantidad;

      itemsProcesados.push({
        producto: producto._id,
        nombre: producto.nombre,
        imagen: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : null,
        talla: item.talla,
        cantidad: item.cantidad,
        precioUnitario,
        tieneOferta: ofertaActiva,
      });
    }

    const numero = await obtenerSiguienteNumero();

    const reserva = new Reserva({
      numero,
      items: itemsProcesados,
      cliente,
      total,
      requierePagoCompleto,
    });

    await reserva.save();
    res.status(201).json(reserva);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al crear reserva", error: error.message });
  }
};

const obtenerReservas = async (req, res) => {
  try {
    const filtro = {};

    if (req.query.historial === "true") {
      filtro.estado = "compra_exitosa";
    } else {
      filtro.estado = { $ne: "compra_exitosa" };
    }

    const reservas = await Reserva.find(filtro).sort({ createdAt: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener reservas", error: error.message });
  }
};

const actualizarEstadoReserva = async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ["pendiente", "atendido", "suspendido", "compra_exitosa"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ mensaje: "Estado invalido" });
    }

    const reserva = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!reserva) {
      return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }

    res.json(reserva);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar reserva", error: error.message });
  }
};

module.exports = {
  crearReserva,
  obtenerReservas,
  actualizarEstadoReserva,
};
