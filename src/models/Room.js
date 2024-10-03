const mongoose = require('mongoose');
const { SUPPORTED_ROOM_TYPES } = require('../utils/constants');

const RoomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  floorNumber: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: String,
    required: true,
    unique: true // Ensure each room has a unique identifier
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available'
  }
}, { timestamps: true });

// Create a compound index to enforce unique room numbers per hotel
RoomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);
