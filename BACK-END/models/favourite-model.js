const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tempatWisataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TempatWisata",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Favourite", favouriteSchema);
