const Room = require('../models/Room'); // Import your Room model

// Create a new room
exports.createRoom = async (req, res) => {
    const { hotel, roomNumber, type, pricePerNight, status, maxOccupancy, amenities } = req.body;
  
    // Check for missing required fields
    if (!hotel || !roomNumber || !type || !pricePerNight || !maxOccupancy) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
  
    try {
      const newRoom = await Room.create({
        hotel,
        roomNumber,
        type,
        pricePerNight,
        status: status || 'available', // Default to 'available' if status is not provided
        maxOccupancy,
        amenities
      });
  
      res.status(201).json({
        message: 'Room created successfully',
        room: newRoom
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific room by ID
exports.getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update room details
exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRoom = await Room.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRoom = await Room.findByIdAndDelete(id);
    if (!deletedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update room status
exports.updateRoomStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expecting status field in request body
  try {
    const updatedRoom = await Room.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room status updated successfully', room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark room as under maintenance
exports.markRoomUnderMaintenance = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRoom = await Room.findByIdAndUpdate(id, { status: 'under maintenance' }, { new: true });
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room marked as under maintenance', room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
