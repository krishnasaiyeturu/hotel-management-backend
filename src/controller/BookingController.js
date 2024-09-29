const Booking = require("../models/Booking");
const Room = require("../models/Room");

exports.createBooking = async (req, res) => {
    const { roomType, guest, startDate, endDate } = req.body;
  
    try {
      // Find available rooms of the requested type
      const availableRooms = await Room.find({
        type: roomType,
        status: 'available'
      });
  
      // Check for overlapping bookings for each available room
      const bookedRoom = await Booking.findOne({
        room: { $in: availableRooms.map(room => room._id) },
        $or: [
          { startDate: { $lt: endDate, $gte: startDate } }, // overlaps
          { endDate: { $gt: startDate, $lte: endDate } }    // overlaps
        ]
      });
  
      if (bookedRoom) {
        return res.status(400).json({ message: 'All rooms of this type are booked for the selected dates' });
      }
  
      // If there's an available room, book the first one (or implement a more complex allocation logic)
      const roomToBook = availableRooms[0];
  
      // Create the booking
      const newBooking = await Booking.create({
        room: roomToBook._id,
        guest,
        startDate,
        endDate
      });
  
      // Update the room's status
      roomToBook.status = 'booked'; // Change status to booked
      await roomToBook.save();
  
      res.status(201).json({
        message: 'Booking created successfully',
        booking: newBooking
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  