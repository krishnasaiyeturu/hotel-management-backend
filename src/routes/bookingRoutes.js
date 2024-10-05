const express = require('express');
const router = express.Router();
const bookingsController = require('../controller/BookingController');

// // Check room availability
// router.get('/rooms/availability', bookingsController.checkRoomAvailability);

// Create a booking
router.post('/', bookingsController.createBooking);
router.post('/check-availability', bookingsController.checkAvailability);
router.get('/', bookingsController.getBookingDetails);
router.post('/calculate-total-price', bookingsController.calculateTotalPrice);
router.put('/check-in/:bookingId', bookingsController.UpdateCheckIn);



module.exports = router;
