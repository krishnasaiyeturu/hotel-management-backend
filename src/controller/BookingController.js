// controllers/bookingController.js
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Guest = require('../models/Guest');
const s3 = require('../utils/s3');


exports.createBooking = async (req, res) => {
  try {
    const {
      checkIn,
      checkOut,
      hotelType,
      rooms,
      adults,
      children,
      guestInformation,
      address,
    } = req.body;

    // Validate input
    if (!checkIn || !checkOut || !hotelType || !rooms || !guestInformation || !address) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Find the room type to calculate total price
    const roomType = await RoomType.findById(hotelType);
    if (!roomType) {
      return res.status(404).json({ message: 'Room type not found.' });
    }

    // Find all rooms of the selected room type
    const totalRooms = await Room.find({ roomType: hotelType }).select('_id');

    // Find bookings that overlap with the requested check-in and check-out dates
    const overlappingBookings = await Booking.find({
      roomType: hotelType,
      $or: [
        { checkInDate: { $gte: new Date(checkIn), $lt: new Date(checkOut) } },
        { checkOutDate: { $gt: new Date(checkIn), $lte: new Date(checkOut) } },
      ],
    });

    // Sum up the number of rooms booked in the overlapping bookings
    const bookedRoomCount = overlappingBookings.reduce((total, booking) => total + booking.numberOfRooms, 0);

    // Calculate the number of rooms available by subtracting booked rooms from the total rooms
    const availableRooms = totalRooms.length - bookedRoomCount;

    if (availableRooms < rooms) {
      return res.status(400).json({ message: 'Not enough rooms available for the selected dates.' });
    }

    // Calculate total price based on room type price per night and number of rooms
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days

    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date.' });
    }

    console.log("totalPrice",roomType.pricePerNight,rooms,nights);

    const totalPrice = roomType.pricePerNight * rooms * nights;

        // Check if the guest already exists by email
        let guest = await Guest.findOne({ email: guestInformation.email });

        // If the guest does not exist, create a new guest
        if (!guest) {
          guest = new Guest({
            firstName: guestInformation.firstName,
            lastName: guestInformation.lastName,
            email: guestInformation.email,
            address: {
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              country: address.country,
              state: address.state,
              city: address.city,
              zipCode: address.zipCode,
            },
          });
          await guest.save(); // Save the new guest
        }

    // Create a new booking
    const newBooking = new Booking({
      guest: guest._id,
      roomType: hotelType,
      numberOfRooms: rooms,
      numberOfAdults: adults,
      numberOfChildren: children,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      totalPrice,
      bookingSource: 'online', // Assuming default; adjust as needed
      bookingChannel: 'website', // Assuming default; adjust as needed
    });

    // Save the booking to the database
    await newBooking.save();

    // Update guest's bookings array
    await Guest.findByIdAndUpdate(guest._id, { $push: { bookings: newBooking._id } });

    // Respond with the created booking details
    res.status(201).json(newBooking);
  } catch (error) {
    console.error(error);
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


exports.checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut, rooms } = req.body;

    // Validate input
    if (!checkIn || !checkOut || !rooms) {
      return res.status(400).json({ message: 'Check-in, check-out, and number of rooms are required.' });
    }

    // Convert check-in and check-out dates to Date objects
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date.' });
    }

    // Find all room types
    const roomTypes = await RoomType.find().populate('hotel'); // Populate hotel details

    // Generate pre-signed URLs for each room type's photos
    const roomTypesWithPresignedUrls = await Promise.all(roomTypes.map(async roomType => {
      const photosWithPresignedUrls = await Promise.all(
        roomType?.photos?.map(async (photoUrl) => {
          const { bucketName, keyName } = await s3.extractBucketAndKey(photoUrl);
          // Generate a pre-signed URL using the extracted key
          return await s3.generatePresignedUrl(bucketName, keyName);
        }) || [] // Default to empty array if no photos
      );

      return {
        ...roomType.toObject(),
        photos: photosWithPresignedUrls, // Replace photos with pre-signed URLs
      };
    }));

    // Prepare response data
    const availabilityStatus = [];

    for (const roomType of roomTypesWithPresignedUrls) {
      // Find total rooms for the current room type
      const totalRooms = await Room.find({ roomType: roomType._id }).countDocuments();

      // Find bookings that overlap with the requested dates for the current room type
      const overlappingBookings = await Booking.find({
        roomType: roomType._id,
        $or: [
          { checkInDate: { $gte: checkInDate, $lt: checkOutDate } },
          { checkOutDate: { $gt: checkInDate, $lte: checkOutDate } },
        ],
      });

      // Sum up the number of rooms booked in the overlapping bookings
      const bookedRoomCount = overlappingBookings.reduce((total, booking) => total + booking.numberOfRooms, 0);

      // Calculate available rooms by subtracting booked rooms from total rooms
      const availableRooms = totalRooms - bookedRoomCount;

      // Add room type availability status to response
      availabilityStatus.push({
        _id: roomType._id,
        name: roomType.name,
        description: roomType.description,
        maxOccupancy: roomType.maxOccupancy,
        pricePerNight: roomType.pricePerNight,
        amenities: roomType.amenities,
        photos: roomType.photos, // Photos now contain pre-signed URLs
        hotel: {
          _id: roomType.hotel._id,
          name: roomType.hotel.name,
          location: roomType.hotel.location,
          contact: roomType.hotel.contact,
          amenities: roomType.hotel.amenities,
          rating: roomType.hotel.rating,
        },
        availableRooms, // Number of available rooms for this type
        availableStatus: availableRooms > 0 // This will be true if there are available rooms, otherwise false
      });
    }

    // Check if there are enough rooms available across all types
    const totalAvailableRooms = availabilityStatus.reduce((total, type) => total + type.availableRooms, 0);

    // Return success response with availability status
    return res.status(200).json({
      message: totalAvailableRooms >= rooms ? 'Rooms are available.' : 'Not enough rooms available for the selected dates.',
      availabilityTypes:availabilityStatus,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



