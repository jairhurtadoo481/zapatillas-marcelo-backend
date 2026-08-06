const mongoose = require("mongoose");

const itemReservaSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  nombre: { type: String, required: true },
  codigo: { type: String, default: "" },
  imagen: { type: String, default: null },
  talla: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  precioUnitario: { type: Number, required: true },
  tieneOferta: { type: Boolean, default: false },
}, { _id: false });

const reservaSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true },
  items: [itemReservaSchema],
  cliente: {
    nombre: { type: String, required: true, trim: true },
    celular: { type: String, required: true, trim: true },
    ciudad: {
      type: String,
      required: true,
      enum: ["andahuaylas", "fuera"],
    },
    entregaDomicilio: { type: Boolean, default: false },
    direccion: { type: String, default: "" },
  },
  estado: {
    type: String,
    enum: ["pendiente", "atendido", "suspendido", "compra_exitosa"],
    default: "pendiente",
  },
  requierePagoCompleto: { type: Boolean, default: false },
  total: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Reserva", reservaSchema);
