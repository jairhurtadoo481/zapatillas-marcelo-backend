const mongoose = require("mongoose");

const ventaSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  codigo: { type: String, default: "" },
  nombre: { type: String, required: true },
  marca: { type: String, default: "" },
  imagen: { type: String, default: null },
  sucursal: { type: String, default: "sucursal1" },
  talla: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  precioUnitario: { type: Number, required: true },
  descuento: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Venta", ventaSchema);
