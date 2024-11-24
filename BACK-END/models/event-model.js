const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventLokalSchema = new Schema({
  imageUrl: { type: String, require: true },
  eventName: { type: String, require: true }, // Nama Event yang Dilaksanakan
  tentangEvent: { type: String, require: true }, // Isi Informasi Tentang Event
  createdAt: { type: Date, default: Date.now }, // Waktu dilaksanakan/dibuat
});

module.exports = mongoose.model("EventLokal", eventLokalSchema);
