const express = require('express');
const app = express();
app.use(express.json()); // body-parser
const ejs = require('ejs');

require('./src/database');
let ProductModel = require('./src/models/product');


// Basic route
// Show all the products available
app.route('/').get((req, res) => {
    for (i=0; i<10; i++){
        nameP = generateRandomString(10);
        price = generateRandomInt(0,10000);
        brand = generateRandomString(5);

        let product = new ProductModel({name: nameP, price: price, brand: brand});
        product.save((err) => {
            if (err) res.status(503).send(`error: ${err}`); 
        });
    }
    
    res.sendFile('productsList.html', {root: './src/pages/products/'});
});

// Create module
app.route('/products/create').get((req, res) =>{
    res.sendFile('insert.html', {root: './src/pages/products/'});
});

app.route('/products/create').post((req, res) =>{
    let{ name, price, brand} = req.body; // JS object deconstruction
    
    let product = new ProductModel({name: name, price: price, brand: brand});
    product.save((err) => {
        if (err) res.status(503).send(`error: ${err}`); 
        else res.send(product);
    });
});

// Show all the products available
app.route('/products/all').get((req, res) => {
    res.sendFile('productsList.html', {root: './src/pages/products/'});
});

app.route('/products').get(async (req, res) => {
    let allProducts = await ProductModel.find();
    res.send(allProducts);
});

app.route('/products/:id').get(async (req, res) => {
    let productId  = req.params.id;
    let product = await ProductModel.findOne({_id: productId});
    if (product)
        res.send(product);
    else
        res.status(404).end(`Product with id ${productId} does not exist`)
});

app.route('/products/:id').put((req, res) => {
    let productId  = req.params.id;
    let{ name, price, brand} = req.body;
    ProductModel.findOneAndUpdate(
        {_id: productId}, // selection criteria
        {
            name: name,
            price: price,
            brand: brand
        }
    )
    .then(product => res.send(product))
    .catch(err => { console.log(error); res.status(503).end(`Could not update product ${error}`); });
});

app.route('/products/:id').delete((req, res) => {
    let productId  = req.params.id;
    ProductModel.findOneAndDelete({_id: productId})
    .then(product => res.send(product))
    .catch(err => { console.log(error); res.status(503).end(`Could not delete product ${error}`); });
});

app.route('/products/:id/edit').get((req, res) => {
    let productId  = req.params.id;

    // load the product as string, leaver some markers and replace the markers with the info you need
    // create the page from scratch dynamically

    ejs.renderFile('./src/pages/products/edit.html', {productId: productId}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`); 
        else {
            res.end(str);
        }
    });
});

app.route('/products/insert/insertMany/').get((req, res) => {
    for (i=0; i<10; i++){
        nameP = generateRandomString(10);
        price = generateRandomInt(0,10000);
        brand = generateRandomString(5);

        let product = new ProductModel({name: nameP, price: price, brand: brand});
        product.save((err) => {
            if (err) res.status(503).send(`error: ${err}`); 
        });
    }
    res.send('done');
});

const portNumber = 3000;
var server = app.listen(portNumber, function(){
    console.log('Express Server ready and running');
});

function generateRandomString(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

function generateRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}