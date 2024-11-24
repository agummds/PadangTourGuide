const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: { type: String, require: true },
  email: { type: String, require: true, unique: true },
  PhoneNum : {type :String, require: true },
  password: { type: String, require: true },
  createOn: { type: Date, default: Date.now },
  role: { type: String, enum: ["user", "admin"], default: "user" }, // Default "user"
  favorit: [{ type: mongoose.Schema.Types.ObjectId, ref: "TempatWisata" }], // Tambahkan favorit di model user
});

module.exports = mongoose.model("User", userSchema);
