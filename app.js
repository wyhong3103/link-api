const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('./chat-socket');
require('dotenv').config();

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
