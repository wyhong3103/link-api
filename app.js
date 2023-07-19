const express = require('express');
const compression = require("compression");
const helmet = require("helmet");
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
require('./chat-socket');

const indexRouter = require('./routes/index');

mongoose.set("strictQuery", false);

const mongoDB = process.env.MONGODB;

main().catch(
    err => console.log(err)
)

async function main(){
    await mongoose.connect(mongoDB);
}

const app = express();

const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 120,
});

app.use(limiter);
app.use(compression());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors(
    {
        origin : process.env.CLIENT_URL,
        credentials : true
    }
));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
