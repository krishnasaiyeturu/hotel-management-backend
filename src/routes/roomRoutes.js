const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController'); // Adjust path as needed
const { authenticate, authorize } = require('../middleware/auth');

// Room Operations
router.post('/', authorize(['admin', 'manager']), roomController.createRoom); // Create a new room
router.get('/', roomController.getAllRooms); // View all rooms
router.get('/:id', roomController.getRoomById); // Get specific room details
router.put('/:id', authorize(['admin', 'manager']), roomController.updateRoom); // Update room details
router.delete('/:id', authorize(['admin']), roomController.deleteRoom); // Delete a room

// Room Status Management
router.put('/:id/status', authorize(['housekeeping']), roomController.updateRoomStatus); // Update room status
router.put('/:id/maintenance', authorize(['maintenance']), roomController.markRoomUnderMaintenance); // Mark room as under maintenance

module.exports = router;
