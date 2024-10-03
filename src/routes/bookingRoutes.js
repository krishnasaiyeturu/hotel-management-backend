const express = require('express');
const router = express.Router();
const bookingsController = require('../controller/BookingController');

// // Check room availability
// router.get('/rooms/availability', bookingsController.checkRoomAvailability);

// Create a booking
router.post('/bookings', bookingsController.createBooking);

router.get('/bookings', bookingsController.getAllBookings);



module.exports = router;
