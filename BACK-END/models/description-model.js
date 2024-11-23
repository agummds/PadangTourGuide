const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const descriptionSchema = new Schema({
  destinationName: { type: String, require: true },
  description: { type: String, require: true},
  //descriptionDate : {type :Date, require: true},
  imageUrl : {type: String, require: true},
  isFavourite : {type: Boolean, default : false},
});

module.exports = mongoose.model("NameDescription", descriptionSchema);
