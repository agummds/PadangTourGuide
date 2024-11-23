const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ulasanSchema = new Schema({
  UserName: { type: String, require: true }, // Nama pengguna yang memberikan ulasan
  Ulasan: { type: String, require: true },  // Isi ulasan
  Rating: { 
    type: Number, 
    require: true, 
    min: 1, // Minimum nilai rating
    max: 5  // Maksimum nilai rating
  },
  createdAt: { type: Date, default: Date.now }, // Waktu ulasan dibuat
});

module.exports = mongoose.model("UlasanRating", ulasanSchema);
