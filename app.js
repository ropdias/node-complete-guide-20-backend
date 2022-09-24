const path = require("path");

require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");

const feedRoutes = require('./routes/feed');

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

// This is the special type of middleware called "error handling middleware" with 4 arguments that Express will
// move right away to it when you can next() with an Error inside:
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500; // Will be 500 if statusCode is undefined
    const message = error.message; // This property exists by default and it holds the message you pass to the constructor of the error
    res.status(status).json({message: message});
  });

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });