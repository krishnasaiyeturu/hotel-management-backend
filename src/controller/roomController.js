const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const s3 = require('../utils/s3');
const url = require('url'); 
import dotenv from 'dotenv';
import { S3_BUCKET_NAME, SUPPORTED_ROOM_TYPES } from '../utils/constants';
import { Json } from 'sequelize/lib/utils';
dotenv.config();


// Create a new room
exports.createRoomAndRoomType = async (req, res) => {
  const {
    hotel,
    rooms, // Now an array of objects, each containing roomNumber and floorNumber
    roomTypeName,
    description,
    maxOccupancy,
    pricePerNight,
    amenities
  } = req.body;

  // Check for missing required fields for both Room and RoomType
  if (!hotel || !rooms || !roomTypeName || !maxOccupancy || !pricePerNight) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Handle multiple photos for RoomType from the request
  const photos = req.files; // Assuming photos are sent as multipart/form-data
  let photoUrls = [];

  try {
    // Upload photos if provided
    if (photos && photos.length > 0) {
      for (let photo of photos) {
        const photoBuffer = photo.buffer;
        const photoName = `${hotel}-${roomTypeName}-${Date.now()}-${photo.originalname}`;
        const s3Url = await s3.uploadFileToS3(S3_BUCKET_NAME, photoName, photoBuffer, false);
        photoUrls.push(s3Url);
      }
    }

    // Step 1: Create or find the RoomType
    let roomType = await RoomType.findOne({ hotel, name: roomTypeName });

    if (!roomType) {
      roomType = await RoomType.create({
        hotel,
        name: roomTypeName,
        description: description || '',
        maxOccupancy,
        pricePerNight,
        amenities:JSON.parse(amenities),
        photos: photoUrls
      });
    }

    // Step 2: Create multiple rooms with reference to the new RoomType
    let roomsArray = JSON.parse(rooms)
    const newRooms = [];
    for (let i = 0; i < roomsArray.length; i++) {
      const { roomNumber, floorNumber } = roomsArray[i]; // Extract roomNumber and floorNumber from each object
      const newRoom = await Room.create({
        hotel,
        roomNumber,
        floorNumber,
        type: roomType._id, // Reference the newly created or found RoomType
        status: 'available'
      });
      newRooms.push(newRoom);
    }

    res.status(201).json({
      message: 'RoomType and Rooms created successfully',
      roomType,
      rooms: newRooms
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create RoomType and Rooms', error: error.message });
  }
};


exports.getAllRooms = async (req, res) => {
  try {
    // Extract filters from query parameters
    const filters = {};

    // Filter by hotel if provided
    if (req.query.hotel) {
      filters.hotel = req.query.hotel; // Assuming hotel is an ObjectId
    }
    // Filter by room type if provided
    if (req.query.type) {
      const roomType = await RoomType.findOne({ name: req.query.type });
      if (roomType) {
        filters.type = roomType._id; // Use ObjectId of RoomType
      }
    }
    // Filter by price per night if provided
    if (req.query.pricePerNight) {
      filters.pricePerNight = { $lte: Number(req.query.pricePerNight) }; // Max price filter
    }
    // Filter by status if provided
    if (req.query.status) {
      filters.status = req.query.status; // Valid statuses: 'available', 'booked', 'maintenance'
    }
    // Filter by max occupancy if provided
    if (req.query.maxOccupancy) {
      filters.maxOccupancy = { $gte: Number(req.query.maxOccupancy) }; // Min occupancy filter
    }

    // Find rooms based on filters
    const rooms = await Room.find(filters).populate('type'); // Populate room type details

    // The S3 bucket name from your environment or hard-coded value
    const bucketName = S3_BUCKET_NAME;

    // Map through rooms and generate pre-signed URLs for photos
    const roomsWithPresignedUrls = rooms.map(room => {
      // If photos exist, map through each one and generate a pre-signed URL
      const photosWithPresignedUrls = room.type?.photos?.map(photoUrl => {
        // Extract the key from the full S3 URL
        const parsedUrl = url.parse(photoUrl);
        const keyName = parsedUrl.pathname.substring(1); // Remove the leading '/' from the path

        // Generate a pre-signed URL using the extracted key
        return s3.generatePresignedUrl(bucketName, keyName);
      }) || []; // Default to empty array if no photos

      return {
        ...room.toObject(),
        roomType: room.type?.name, // Include room type name in response
        photos: photosWithPresignedUrls // Return array of pre-signed URLs
      };
    });

    // Send response with rooms including presigned photo URLs
    res.status(200).json(roomsWithPresignedUrls);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get specific room by ID
exports.getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id).populate('type'); // Populate the RoomType details
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Generate pre-signed URLs for photos of the room type
    const bucketName = S3_BUCKET_NAME; // Your S3 bucket name
    const photosWithPresignedUrls = room.type?.photos?.map(photoUrl => {
      const parsedUrl = url.parse(photoUrl);
      const keyName = parsedUrl.pathname.substring(1); // Remove the leading '/' from the path
      return s3.generatePresignedUrl(bucketName, keyName); // Generate pre-signed URL
    }) || []; // Default to an empty array if no photos exist

    // Prepare response
    res.status(200).json({
      ...room.toObject(),
      roomType: room.type?.name, // Include room type name in response
      photos: photosWithPresignedUrls // Include pre-signed URLs for photos
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getRoomTypes = async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      data: SUPPORTED_ROOM_TYPES
    });
  } catch (error) {
    console.error(error);
  }
  
};
