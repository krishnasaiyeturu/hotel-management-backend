// controllers/bookingController.js
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');

exports.createBooking = async (req, res) => {
  const { roomType, hotel, checkInDate, checkOutDate, guest } = req.body;
  // Validate required fields
  if (!roomType || !hotel || !checkInDate || !checkOutDate || !guest) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Convert dates to JavaScript Date objects
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Check for existing bookings that conflict with the desired dates
    const existingBookings = await Booking.find({
      roomType: roomType,
      hotel: hotel,
      $or: [
        {
          checkInDate: { $lt: checkOut }, // Existing booking starts before the new check-out date
          checkOutDate: { $gt: checkIn }, // Existing booking ends after the new check-in date
        }
      ]
    });

    // If there are existing bookings, return an error
    if (existingBookings.length > 0) {
      return res.status(404).json({ message: 'No rooms available for the selected dates' });
    }

    // Get all available rooms for the specified room type and hotel
    const allRooms = await Room.find({
      type: roomType,
      hotel: hotel,
    });

    // Filter out the rooms that are currently booked
    const bookedRoomIds = existingBookings.map(booking => booking.room); // Assuming you have a room field in your Booking model

    const availableRooms = allRooms.filter(room => 
      room.status === 'available' && !bookedRoomIds.includes(room._id)
    );

    // If no available rooms, return an error
    if (availableRooms.length === 0) {
      return res.status(404).json({ message: 'No rooms available for the selected room type' });
    }

    // Create the booking
    const newBooking = new Booking({
      roomType,
      hotel,
      checkInDate: checkIn, // Save as Date object
      checkOutDate: checkOut, // Save as Date object
      guest,
      room: availableRooms[0]._id // Assigning the first available room to the booking
    });

    await newBooking.save();

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.getAllBookings = async (req, res) => {
  try {
    // Extract filters from query parameters
    const filters = {};

    // Filter by hotel if provided
    if (req.query.hotel) {
      filters.hotel = req.query.hotel; // Assuming hotel is an ObjectId
    }
    // Filter by room type if provided
    if (req.query.roomType) {
      filters.roomType = req.query.roomType; // Room type ObjectId
    }
    // Filter by user if provided
    if (req.query.user) {
      filters.user = req.query.user; // User ID
    }
    // Filter by check-in date range if provided
    if (req.query.checkInDate) {
      filters.checkInDate = { $gte: new Date(req.query.checkInDate) }; // From given date onward
    }
    // Filter by check-out date range if provided
    if (req.query.checkOutDate) {
      filters.checkOutDate = { $lte: new Date(req.query.checkOutDate) }; // Until given date
    }

    // Fetch bookings based on filters
    const bookings = await Booking.find(filters)
      .populate('roomType') // Optional: populate with room type details
      .populate('hotel') // Optional: populate with hotel details
      .populate('guest'); // Optional: populate with user details

    // Send response with filtered bookings
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

