const express = require('express');
const router = express.Router();
const bookingsController = require('../controller/BookingController');


// Create a booking
router.get('/', bookingsController.getBookingDetails);
router.post('/', bookingsController.createBooking);
router.post('/check-availability', bookingsController.checkAvailability);
router.post('/calculate-total-price', bookingsController.calculateTotalPrice);
router.put('/check-in/:bookingId', bookingsController.UpdateCheckIn);
router.get('/:bookingId', bookingsController.getBookingById);



module.exports = router;
