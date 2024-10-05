const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../utils/constants');


const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false // Initially, room is unassigned. Assign during check-in.
  },
  numberOfRooms: {
    type: Number,
    required: true,
    min: [1, 'At least one room is required.'], // Minimum 1 room
    validate: {
      validator: Number.isInteger,
      message: 'Number of rooms must be an integer.'
    }
  },
  numberOfAdults: {
    type: Number,
    required: true,
    min: [0, 'Number of adults cannot be negative.'], // Minimum 0 adults
    validate: {
      validator: Number.isInteger,
      message: 'Number of adults must be an integer.'
    }
  },
  numberOfChildren: {
    type: Number,
    required: true,
    min: [0, 'Number of children cannot be negative.'], // Minimum 0 children
    validate: {
      validator: Number.isInteger,
      message: 'Number of children must be an integer.'
    }
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // This will compare checkOutDate with checkInDate
        return value > this.checkInDate; // Check if checkOutDate is after checkInDate
      },
      message: 'Check-out date must be after check-in date.'
    }
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative.'],
  },
  totalPriceAfterTax: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative.'],
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

  const randomNum = Math.floor(1000 + Math.random() * 9000).toString(); // Random 4 digits

  return `BK${day}${month}${year}${randomNum}`;
};

// Pre-save hook to generate a unique booking ID
BookingSchema.pre('save', async function(next) {
  if (!this.bookingId) { // Only generate if no bookingId is set
    this.bookingId = generateBookingId(new Date());
  }
  // Calculate total price
  // if (this.isModified('checkInDate') || this.isModified('checkOutDate') || this.isModified('numberOfRooms') || this.isModified('room')) {
  //   try {
  //     const room = await RoomType.findById(this.room);
  //     if (!room) {
  //       return next(new Error('Room not found.'));
  //     }

  //     const duration = Math.ceil((this.checkOutDate - this.checkInDate) / (1000 * 60 * 60 * 24)); // Calculate duration in days
  //     this.totalPrice = room.pricePerNight * this.numberOfRooms * duration; // Calculate total price
  //   } catch (error) {
  //     return next(error); // Handle any errors in fetching the room
  //   }
  // }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
