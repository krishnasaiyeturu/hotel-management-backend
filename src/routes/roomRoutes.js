const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController'); // Adjust path as needed
const {authenticate , authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/room-types',roomController.getRoomTypes);
router.get('/public',roomController.getAllRoomTypes);


// Room Operations
router.post('/',upload.array('photos'), roomController.createRoomAndRoomType); // Create a new room
router.get('/', authenticate , roomController.getAllRooms); // View all rooms
router.get('/:id', roomController.getRoomById); // Get specific room details



module.exports = router;
