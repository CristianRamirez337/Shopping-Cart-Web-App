let mongoose = require('mongoose')
let validator = require('validator')
// https://www.npmjs.com/package/validator

let productSchema = new mongoose.Schema({
  name: {type: String, required: [true, 'A name for the product is needed']},
  price: { type: Number, required: [true, 'A price for the product is needed']},
  brand: String,
});

module.exports = mongoose.model('Product', productSchema);