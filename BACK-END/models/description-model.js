const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set("strictPopulate", false);

const descriptionSchema = new Schema({
  destinationName: { type: String, require: true },
  description: { type: String, require: true},
  imageUrl : {type: String, require: true},
});

module.exports = mongoose.model("NameDescription", descriptionSchema);
