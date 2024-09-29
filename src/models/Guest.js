const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true
  },
  phone: String,
  address: String,
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Guest', GuestSchema);
