const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../utils/constants');

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: BOOKING_STATUS,
    default: 'booked'
  },
  bookingSource: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  bookingChannel: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'walk_in', 'agent'],
    required: true
  }
}, { timestamps: true });


// Function to generate a unique booking ID
const generateBookingId = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = String(date.getFullYear()).slice(-2); // Last two digits of the year

  // Generate a random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000).toString(); // Random 4 digits

  return `BK${day}${month}${year}${randomNum}`;
};

// Pre-save hook to generate a unique booking ID
BookingSchema.pre('save', async function(next) {
  if (!this.bookingId) { // Only generate if no bookingId is set
    this.bookingId = generateBookingId(new Date());
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
