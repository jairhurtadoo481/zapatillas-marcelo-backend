const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const conectarDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productoRoutes = require("./routes/productoRoutes");
const reservaRoutes = require("./routes/reservaRoutes");
const ventaRoutes = require("./routes/ventaRoutes");

conectarDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Zapatillas Marcelo funcionando");
});

app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/ventas", ventaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
