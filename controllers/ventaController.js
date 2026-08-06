const Venta = require("../models/Venta");
const Producto = require("../models/Producto");

const registrarVenta = async (req, res) => {
  try {
    const { codigo, talla, cantidad, descuento } = req.body;

    if (!codigo || !talla || !cantidad || cantidad <= 0) {
      return res.status(400).json({ mensaje: "Debes indicar codigo, talla y cantidad (mayor a 0)" });
    }

    const producto = await Producto.findOne({ codigo: codigo.trim() });
    if (!producto) {
      return res.status(404).json({ mensaje: `No se encontro ningun producto con el codigo ${codigo}` });
    }

    const itemTalla = producto.tallas.find((t) => t.talla === talla);
    if (!itemTalla) {
      return res.status(404).json({ mensaje: `El producto #${codigo} no tiene la talla ${talla}` });
    }

    if (itemTalla.stock < cantidad) {
      return res.status(400).json({
        mensaje: `Stock insuficiente para #${codigo} talla ${talla}. Disponible: ${itemTalla.stock}`,
      });
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
    const descuentoAplicado = Number(descuento) || 0;
    const totalSinDescuento = precioUnitario * cantidad;

    if (descuentoAplicado < 0) {
      return res.status(400).json({ mensaje: "El descuento no puede ser negativo" });
    }

    if (descuentoAplicado > totalSinDescuento) {
      return res.status(400).json({ mensaje: "El descuento no puede ser mayor al total de la venta" });
    }

    itemTalla.stock -= cantidad;
    await producto.save();

    const venta = new Venta({
      producto: producto._id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      marca: producto.marca,
      imagen: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : null,
      sucursal: producto.sucursal,
      talla,
      cantidad,
      precioUnitario,
      descuento: descuentoAplicado,
    });

    await venta.save();

    res.status(201).json(venta);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al registrar venta", error: error.message });
  }
};

const obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find().sort({ createdAt: -1 });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener ventas", error: error.message });
  }
};

const buscarProductoPorCodigo = async (req, res) => {
  try {
    const producto = await Producto.findOne({ codigo: req.params.codigo.trim() });
    if (!producto) {
      return res.status(404).json({ mensaje: `No se encontro ningun producto con el codigo ${req.params.codigo}` });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al buscar producto", error: error.message });
  }
};

module.exports = {
  registrarVenta,
  obtenerVentas,
  buscarProductoPorCodigo,
};
