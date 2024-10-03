// models/RoomType.js
const mongoose = require("mongoose");

const RoomTypeSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true, // Ensure that each room type name is unique
    },
    description: {
      type: String,
      default: "", // Optional description for the room type
    },
    maxOccupancy: {
      type: Number,
      required: true, // Define max occupancy for each room type
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    amenities: [String], // e.g., ['WiFi', 'TV', 'Air Conditioning']
    photos: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomType", RoomTypeSchema);
