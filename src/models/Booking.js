const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
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
    enum: ['booked', 'checked-in', 'checked-out', 'canceled'],
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

module.exports = mongoose.model('Booking', BookingSchema);
