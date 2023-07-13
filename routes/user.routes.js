const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userMiddleware = require('../middlewares/user.middleware');

const multer = require('multer');
const upload = multer({dest : "uploads/"});

/*

Get all the users {first_name, last_name, image}

*/
router.get('/', userMiddleware.authorizeUser, userController.get_users);

/*

Get a specific user {first_name, last_name, image, friends, posts, [friend_requests iff user is self]}

*/
router.get('/:userid', userMiddleware.authorizeUser, userController.get_user);


/*

Send a friend request to :userid

*/
router.post('/:userid/friend-request', userMiddleware.authorizeUser, userController.send_friend_request);

/*

Accept friend request from :friendid as :userid 

*/
router.post('/:userid/friend-request/:friendid', userMiddleware.authorizeUser, userController.manage_friend_request);

/*

Delete friend request as either :userid or :friendid, :userid always have to be the one that has the request

*/
router.delete('/:userid/friend-request/:friendid', userMiddleware.authorizeUser, userController.delete_friend_request);

/*

Delete friend as either :userid or :friendid

*/
router.delete('/:userid/friend/:friendid', userMiddleware.authorizeUser, userController.delete_friend);

/*

Input : {
    old_password, new_password, new_repassword
}

*/
router.put('/:userid/password', userMiddleware.authorizeUser, userController.change_password);

/*

Input : {
    first_name, last_name, [new iamge file]
}

*/
router.put('/:userid', userMiddleware.authorizeUser, upload.single('image') ,userController.update_user_info);

module.exports = router;