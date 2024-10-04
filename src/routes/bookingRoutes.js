const express = require('express');
const router = express.Router();
const bookingsController = require('../controller/BookingController');

// // Check room availability
// router.get('/rooms/availability', bookingsController.checkRoomAvailability);

// Create a booking
router.post('/', bookingsController.createBooking);
router.post('/check-availability', bookingsController.checkAvailability);
router.get('/', bookingsController.getAllBookings);



module.exports = router;
