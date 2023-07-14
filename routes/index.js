const express = require('express');
const router = express.Router();
const authRouter = require('./auth.routes');
const userRouter = require('./user.routes');
const postRouter = require('./post.routes');
const chatRouter = require('./chat.routes');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("Hello");
});

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/post', postRouter);
router.use('/chat', chatRouter);

module.exports = router;
