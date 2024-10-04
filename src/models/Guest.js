const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: [true, 'Please add a first name']
    },
    lastName: {
      type: String,
      required: [true, 'Please add a last name']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true
    },
  address: {
    addressLine1: {
      type: String,
      required: [true, 'Please add an address line 1']
    },
    addressLine2: {
      type: String,
      required: false
    },
    country: {
      type: String,
      required: [true, 'Please add a country']
    },
    state: {
      type: String,
      required: [true, 'Please add a state']
    },
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    zipCode: {
      type: String,
      required: [true, 'Please add a zip code']
    }
  },
  phone: {
    type: String,
    required: false
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Guest', GuestSchema);
