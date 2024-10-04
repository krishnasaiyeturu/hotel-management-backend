const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController'); // Adjust path as needed
const {authenticate , authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/room-types',roomController.getRoomTypes);
router.get('/public',roomController.getAllRoomTypes);
router.get('/public/:roomTypeId', roomController.getRoomTypeById); // Get specific room details


// Room Operations
router.post('/',upload.array('photos'), roomController.createRoomAndRoomType); // Create a new room
router.get("/room-status-counts", roomController.getRoomStatusCounts);
router.get('/', authenticate , roomController.getAllRooms); // View all rooms
// router.get('/:id', roomController.getRoomTypeById); // Get specific room details



module.exports = router;
