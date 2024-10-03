const express = require('express');
const router = express.Router();

const HotelController = require('../controller/HotelController');
const { authenticate, authorize } = require('../middleware/auth');


// router.get('/users', authenticate, authorize(['admin']), getUsers);
// router.post('/register', register);
// router.post('/login', login);

// Route to get all hotels
router.get('/hotels',authenticate, authorize(['admin']),HotelController.getAllHotels);

module.exports = router;
