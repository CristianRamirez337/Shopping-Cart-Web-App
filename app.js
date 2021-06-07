const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const ejs = require('ejs');

// npm install bcryptjs --save
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require('path');

app.use(express.json()); // body-parser
app.use(cookieParser());

require('./src/database');
let ProductModel = require('./src/models/product');
let UsersModel = require('./src/models/user');


// --------------- ROOT USER ---------------
try{
    let userRoot = new UsersModel({name: "cris", email: "elcris@mail.com", password: "thepassword"});
    userRoot.save((err) => {
        //console.log("root created")
    });
}catch (e){
    console.log("root already in DB")
}

// *************/  MIDDLEWARES  \ *************
// Multer is a middleware that allows to store uploaded files
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads');
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now())
    }
});
const upload = multer({ storage: storage});
const { response } = require('express');

const secret = "5tr0n6P@55W0rD";


function generateToken(user) {
    let payload = {
        username: user.name,
        email: user.email,
        id: user.id
    };
    let oneDay = 60 * 60 * 24;
    return token = jwt.sign(payload, secret, { expiresIn: oneDay });
}

// middleware that add the user
function requireLogin(req, res, next){
    let accessToken = req.cookies.authorization
    // if there is no token stored in cookies, the request is unauthorized
    if (!accessToken){
        console.log('Unauthorized user, redirecting to login');
        return res.redirect('/login');
    }

    try{
        // use the jwt.verify method to verify the access token, itthrows an error if the token has expired or has a invalid signature
        payload = jwt.verify(accessToken, secret)
        console.log('Logged user accessing the site ' + payload.username);
        payloadUser = payload.username;
        req.user = payload; // you can retrieve further details from the database. Here I am just taking the name to render it wherever it is needed.
        next()
    }
    catch(e){
        //if an error occured return request unauthorized error, or redirect to login
        // return res.status(401).send():
        res.redirect(403, '/login');
    }
}

// middleware that add the user
function requireLoginRoot(req, res, next){
    let accessToken = req.cookies.authorization
    // if there is no token stored in cookies, the request is unauthorized
    if (!accessToken){
        console.log('Unauthorized user, redirecting to login');
        return res.redirect('/login');
    }

    try{
        // use the jwt.verify method to verify the access token, itthrows an error if the token has expired or has a invalid signature
        payload = jwt.verify(accessToken, secret)
        console.log('Logged user accessing the site ' + payload.username);
        payloadUser = payload.username;
        req.user = payload; // you can retrieve further details from the database. Here I am just taking the name to render it wherever it is needed.
        if (payload.username === 'cris'){
            next()
        } else {
            return res.redirect('/');
        }

    }
    catch(e){
        //if an error occured return request unauthorized error, or redirect to login
        // return res.status(401).send():
        res.redirect(403, '/login');
    }
}



// *************/ USER REGISTER PROFILE\ *************

app.get('/users/register', (req, res) => {
    res.sendFile('register.html', {root: './src/pages/login/'});
});

app.post('/users/register', upload.single('avatar'), async (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    let email = req.body.email;

    avatarObject = {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/jpg'
    };

    let user = new UsersModel({name: name, email: email, password: password, avatar:avatarObject});
    user.save((err) => {

        if (err) res.status(503).send(`error: ${err}`);
        else{

            res.send(user);
        }
    });


});

// *************/ USER LOG IN\ *************

app.get('/', requireLogin, function (req, res) {
    ejs.renderFile('./src/pages/login/main.html', {user: req.user}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`);
        else {
            res.end(str);
        }
    });
});

app.get('/login', function (req, res) {
    res.sendFile('login.html', {root: './src/pages/login/'});
});

app.post('/login',  async (req, res) =>  {
    const { name, password } = req.body;
    let user = await UsersModel.findOne({name: name});

    if (user){

        let success = bcrypt.compareSync(password, user.password);

        if (success === true){
            console.log(`Succesfully logged ${name} in`);
            // Generate an access token
            const accessToken = generateToken(user);
            res.cookie("authorization", accessToken, {secure: true, httpOnly: true});
            res.status(200).json(accessToken);
        }
        else
            res.status(404).send('Invalid credentials');
    }
    else {
        res.status(404).send('Invalid credentials');
    }
});

app.post('/logout', requireLogin, function(req, res){
    console.log(`Logging out ${req.user.username}`)
    res.clearCookie('authorization');
    res.send('User logged out');
});


// *************---------- /USERS VIEW\---------- *************

// Get an user
app.route('/users/:id').get(requireLogin, async (req, res) => {
    let userId  = req.params.id;
    //console.log(userId)
    let allUsers = await UsersModel.findOne({_id: userId})
    //console.log(allUsers._id)
    let isRoot = false;
    let avatar = {};


    try{
        avatar = {
            contentType: allUsers.avatar.contentType,
            data: allUsers.avatar.data.toString('base64')
        };
    }
    catch(e){
        avatar = null;
    }
    if (allUsers.name === 'cris') {
        isRoot = true;
    }
    let modifiedUser = {
        _id: allUsers._id,
        name: allUsers.name,
        email: allUsers.email,
        password: allUsers.password,
        avatar: avatar,
        root : isRoot
    }
    res.send(modifiedUser);

});


// *************---------- /USERS EDIT\---------- *************

app.route('/users/:id/edit').get(requireLogin, (req, res) => {
    let userId  = req.params.id;
    ejs.renderFile('./src/pages/login/edit.html', {userId: userId}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`);
        else {
            res.end(str);
        }
    });
});

app.put('/users/:id', upload.single('avatar'), requireLogin, async (req, res) => {
    let userId = req.params.id;
    let user = await UsersModel.findOne({_id: userId});
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;

    if (req.file){
        console.log('User modified the avatar');
        avatarObject = {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/jpg'
        };
        user.avatar = avatarObject;
    }

    user.save()
        .then(user => res.send(user))
        .catch(error => { console.log(error); res.status(503).end(`Could not update user ${error}`); });
});

// *************---------- /USERS DELETE\---------- *************
app.route('/users/:id').delete(requireLogin, (req, res) => {
    let userId  = req.params.id;
    UsersModel.findOneAndDelete({_id: userId})
        .then(user => res.clearCookie('authorization').send(user))
        .catch(error => { console.log(error); res.status(503).end(`Could not delete user ${error}`); });

});






// *************---------- /Shopping Products\---------- *************
// Access store
app.route('/store').get(requireLogin, (req, res) =>{
    res.sendFile('store.html', {root: './src/pages/products/'});
});

app.route('/generate').get(requireLoginRoot, (req, res) => {
    for (i=0; i<3; i++){
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
app.route('/products/create').get(requireLoginRoot, (req, res) =>{
    res.sendFile('insert.html', {root: './src/pages/products/'});
});

app.route('/products/create').post(requireLoginRoot, (req, res) =>{
    let{ name, price, brand} = req.body; // JS object deconstruction
    
    let product = new ProductModel({name: name, price: price, brand: brand});
    product.save((err) => {
        if (err) res.status(503).send(`error: ${err}`); 
        else res.send(product);
    });
});

// Show all the products available
app.route('/products/all').get(requireLoginRoot, (req, res) => {
    ejs.renderFile('./src/pages/products/productsList.html', {user: req.user}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`);
        else {
            res.end(str);
        }
    });
});

app.route('/products').get(requireLogin, async (req, res) => {
    let allProducts = await ProductModel.find();
    res.send(allProducts);
});

app.route('/products/:id').get(requireLogin, async (req, res) => {
    let productId  = req.params.id;
    let product = await ProductModel.findOne({_id: productId});
    if (product)
        res.send(product);
    else
        res.status(404).end(`Product with id ${productId} does not exist`)
});

app.route('/products/:id').put(requireLoginRoot, (req, res) => {
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
    .catch(error => { console.log(error); res.status(503).end(`Could not update product ${error}`); });
});

app.route('/products/:id').delete(requireLoginRoot, (req, res) => {
    let productId  = req.params.id;
    ProductModel.findOneAndDelete({_id: productId})
    .then(product => res.send(product))
    .catch(error => { console.log(error); res.status(503).end(`Could not delete product ${error}`); });
});

app.route('/products/:id/edit').get(requireLoginRoot, (req, res) => {
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

app.route('/products/insert/insertMany/').get(requireLoginRoot, (req, res) => {
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