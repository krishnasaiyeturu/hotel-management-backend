const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hotel name']
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contact: {
    phone: String,
    email: String
  },
  amenities: [String],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);
