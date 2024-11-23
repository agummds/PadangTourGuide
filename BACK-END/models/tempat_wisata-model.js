const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tempatWisataSchema = new Schema({
  imageUrl: { type: String, require: true },
  namaTempat: { type: String, required: true }, // Nama tempat wisata
  alamat: { type: [String], default: [] }, // Daftar alamat tempat wisata
  jamOperasi: {
    type: Map,
    of: {
      buka: { type: String, required: true }, // Waktu buka, format HH:mm
      tutup: { type: String, required: true }, // Waktu tutup, format HH:mm
    },
    required: true, // Map untuk jam buka/tutup per hari
  },
});

module.exports = mongoose.model("TempatWisata", tempatWisataSchema);
