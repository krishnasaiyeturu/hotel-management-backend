const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomNumber: {
    type: String,
    required: true,
    unique: true // Ensure each room has a unique identifier
  },
  type: {
    type: String,
    enum: [
        'Standard Room',
        '2 Queen Beds Suite',
        '1 King Bed One Bedroom Suite',
        '2 Queen Beds Suite'
      ],
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available'
  },
  maxOccupancy: {
    type: Number,
    required: true
  },
  amenities: [String] // e.g., ['WiFi', 'TV', 'Air Conditioning']
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
