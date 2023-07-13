const express = require('express');
const router = express.Router();
const authRouter = require('./auth');
const userRouter = require('./user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/auth', authRouter);
router.use('/user', userRouter);

module.exports = router;
