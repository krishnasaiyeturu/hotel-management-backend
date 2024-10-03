const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controller/UserController');
const guestController = require('../controller/guestController');

// router.post('/register', userController.register);
router.post('/login', userController.login);

// Route for Guest Registration
router.post('/register', guestController.register);

// Route for Admin to create other roles
router.post('/users',authenticate, authorize(['admin']), userController.createUser);

router.get('/creates3',userController.createS3);

module.exports = router;
