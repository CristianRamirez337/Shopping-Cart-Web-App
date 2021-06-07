let mongoose = require('mongoose')
let validator = require('validator')

let cartSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    cart: {type: Array, required: true},
});

module.exports = mongoose.model('Cart', cartSchema);