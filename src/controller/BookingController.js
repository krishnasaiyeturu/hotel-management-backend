// controllers/bookingController.js
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Guest = require('../models/Guest');
const s3 = require('../utils/s3');
const url = require('url'); 
const mongoose = require('mongoose');
const { TAX_RATE, S3_BUCKET_NAME } = require('../utils/constants');
const { bookingConfirmation } = require('../email_template/booking_confirmation');
const sendEmail = require('../utils/email');
const { createPaymentIntent } = require('../utils/stripeService');

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
      return res.status(400).json({ message: 'Room type not found.' });
    }
    console.log(roomType);
    // Find all rooms of the selected room type
    const totalRooms = await Room.find({ type: roomType._id }).select('_id');

    console.log(totalRooms);
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
    console.log(totalRooms.length ,bookedRoomCount)

    // Calculate the number of rooms available by subtracting booked rooms from the total rooms
    const availableRooms = totalRooms.length - bookedRoomCount;
    console.log(availableRooms,rooms)

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

        // Calculate total price before tax
        const totalPriceBeforeTax = roomType.pricePerNight * rooms * nights;

        const taxRate = TAX_RATE;

        // Calculate total tax amount
      const taxAmount = totalPriceBeforeTax * taxRate;

      // Calculate total price after tax
      const totalPriceAfterTax = totalPriceBeforeTax + taxAmount;


      if (!paymentIntentResult.success) {
        return res.status(500).json({ message: 'Payment initiation failed', error: paymentIntentResult.error });
      }


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
      totalPrice: parseFloat(totalPriceBeforeTax.toFixed(2)), // Convert to float with 2 decimals
      totalPriceAfterTax: parseFloat(totalPriceAfterTax.toFixed(2)), // Convert to float with 2 decimals
      bookingSource: 'online', // Assuming default; adjust as needed
      bookingChannel: 'website', // Assuming default; adjust as needed
      paymentStatus: 'pending',
    });

    // Save the booking to the database
    await newBooking.save();

    // Update guest's bookings array
    await Guest.findByIdAndUpdate(guest._id, { $push: { bookings: newBooking._id } });


    // Create a Payment Intent with Stripe
    const paymentIntentResult = await createPaymentIntent(newBooking.bookingId,totalPriceAfterTax);

    const formattedcheckInDate = new Date(checkInDate);
    const formattedcheckOutDate = new Date(checkOutDate);
    
    
    let emailValues= {
      userName:guestInformation.firstName +" "+ guestInformation.lastName,
      bookingCode:newBooking.bookingId,
      checkIn:formattedcheckInDate.toDateString(),
      checkOut:formattedcheckOutDate.toDateString(),
      pricePerNight:roomType.pricePerNight,
      noOfRooms:rooms,
      noOfNights:nights,
      totalGuests:adults+children,
      roomType:roomType.name,
      totalBeforeTax:totalPriceBeforeTax,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAfterTax:totalPriceAfterTax,
      guestName:guestInformation.firstName +" "+ guestInformation.lastName,
      guestEmail:guestInformation.email
    };

    let email_content = bookingConfirmation(emailValues);

    sendEmail(guestInformation.email,`Booking Confirmation ${newBooking.bookingId}`,email_content)
    // Respond with the created booking details
    // res.status(201).json(newBooking);
    res.status(201).json({
      message: 'Booking initiated, complete payment to confirm',
      bookingId: newBooking.bookingId,
      clientSecret: paymentIntentResult.clientSecret, // Send to frontend to complete the payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error 1', error: error.message });
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
      const totalRooms = await Room.find({ type: roomType._id }).countDocuments();

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
    return res.status(500).json({ message: 'Server error 2', error: error.message });
  }
};


exports.calculateTotalPrice = async (req, res) => {
  try {
    const { checkIn, checkOut, hotelType, rooms } = req.body;

    // Validate input
    if (!checkIn || !checkOut || !hotelType || !rooms) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Find the room type to calculate total price
    const roomType = await RoomType.findById(hotelType);
    if (!roomType) {
      return res.status(400).json({ message: 'Room type not found.' });
    }

    // Calculate the number of nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days

    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date.' });
    }

    // Calculate total price before tax
    const totalPriceBeforeTax = roomType.pricePerNight * rooms * nights;

    const taxRate = TAX_RATE;

    // Calculate total tax amount
    const taxAmount = totalPriceBeforeTax * taxRate;

    // Calculate total price after tax
    const totalPriceAfterTax = totalPriceBeforeTax + taxAmount;


    console.log("Total Price Before Tax:", totalPriceBeforeTax);
    console.log("Tax Amount:", taxAmount);
    console.log("Total Price After Tax:", totalPriceAfterTax);

    // Respond with the total price
    return res.status(200).json({
      pricePerNight: roomType.pricePerNight,
      nights,
      taxRate:`${taxRate*100}%`,
      totalPriceBeforeTax:parseFloat(totalPriceBeforeTax.toFixed(2)),
      taxAmount:parseFloat(taxAmount.toFixed(2)),
      totalPriceAfterTax:parseFloat(totalPriceAfterTax.toFixed(2))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error 3', error: error.message });
  }
};


exports.getCalenderBookingDetails = async (req, res) => {
  try {
    const { hotelId, year, month, status } = req.query;

    // Step 1: Fetch all rooms for the given hotelId
    const rooms = await Room.find({ hotel: hotelId }).select('_id roomNumber').exec();

    if (rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms found for the specified hotel' });
    }

    // Step 2: Define date range for the specified month and year
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed
    const endDate = new Date(year, month, 0); // Last day of the month
    startDate.setDate(startDate.getDate() + 1);
    endDate.setDate(endDate.getDate() + 1);
    console.log(startDate,endDate);

    // Step 3: Fetch bookings within the specified date range and status
    const bookingsQuery = {
      status: status,
      $or: [
        { checkInDate: { $gte: startDate, $lt: endDate } },
        { checkOutDate: { $gt: startDate, $lte: endDate } },
      ],
    };
    
    // Fetch bookings without room for "booked" status
    let bookings;
    if (status === 'booked' || status === 'no-show') {
      bookings = await Booking.find(bookingsQuery)
        .populate({
          path: 'guest',
          select: 'firstName lastName', // Only select guest's name
        })
        .exec();
    } else {
      // For "checked-in" or "checked-out" status, include the room
      bookings = await Booking.find(bookingsQuery)
        .populate({
          path: 'guest',
          select: 'firstName lastName', // Only select guest's name
        })
        .populate({
          path: 'room',
          select: 'roomNumber', // Select room number
        })
        .exec();
    }
    

    // console.log(bookings);

    // Step 4: Format the response
    const response = bookings.map(booking => {
      let roomNumber = null;

      // For check-in or check-out status, show room number
      if (['checked-in', 'checked-out'].includes(booking.status) && booking.room) {
        roomNumber = booking.room.roomNumber;
      }

      return {
        roomNumber: roomNumber, // null for booked, actual number for checkin/checkout
        bookings: [
          {
            _id:booking._id,
            name: `${booking.guest.firstName} ${booking.guest.lastName}`,
            checkin: booking.checkInDate,
            checkout: booking.checkOutDate
          }
        ]
      };
    });

    return res.json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error1kk', error: error });
  }

};


exports.UpdateCheckIn = async (req, res) => {
  const { bookingId } = req.params;
  const { roomIds } = req.body; // Expecting status and roomIds as an array in the request body
  try {
    // Validate input
    if (!bookingId || !Array.isArray(roomIds) || roomIds.length === 0) {
      return res.status(400).json({ message: 'Booking ID and roomIds are required.' });
    }

    // Log the bookingId for debugging
    console.log('Booking ID:', bookingId);

    // Find the booking by bookingId
    const booking = await Booking.findOne({ _id: bookingId });

    // If booking is not found
    if (!booking) {
      return res.status(400).json({ message: 'Booking not found.' });
    }

    // Check each room
    const availableRooms = [];
    for (let roomId of roomIds) {
      const room = await Room.findById(roomId); // Check if the room exists

      // If the room is not found
      if (!room) {
        return res.status(400).json({ message: `Room with ID ${roomId} not found.` });
      }

      // Check if the room is available
      if (room.status !== 'available') {
        return res.status(400).json({ message: `Room with ID ${roomId} is not available for assignment.` });
      }

      // Add the room to the available rooms list
      availableRooms.push(room);
    }

    // Assign all the rooms to the booking
    booking.room = roomIds; // Assuming 'room' is the field in the booking schema for multiple rooms
    booking.status = 'checked-in'; // Update the booking status to checked-in

    // Update the status of each room to 'booked'
    for (let room of availableRooms) {
      room.status = 'booked';
      await room.save(); // Save each room's status
    }

    await booking.save(); // Save the updated booking

    // Respond with the updated booking
    return res.status(200).json({ message: 'Check-In updated successfully.', booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while updating the booking.', error });
  }
};


exports.UpdateCheckOut = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Validate input
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required.' });
    }

    // Log the bookingId for debugging
    console.log('Booking ID:', bookingId);

    // Find the booking by bookingId
    const booking = await Booking.findOne({ _id: bookingId });

    // If booking is not found
    if (!booking) {
      return res.status(400).json({ message: 'Booking not found.' });
    }

    // Check if the booking is already checked-out
    if (booking.status === 'checked-out') {
      return res.status(400).json({ message: 'Booking is already checked out.' });
    }

    // Retrieve the rooms associated with the booking
    const rooms = booking.room; // Assuming 'room' is the field holding the room IDs

    if (!rooms || rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms associated with this booking.' });
    }

    // Update the status of each room to 'available'
    for (let roomId of rooms) {
      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(400).json({ message: `Room with ID ${roomId} not found.` });
      }

      room.status = 'available'; // this is should goto maintenance 
      await room.save(); // Save each room's status
    }

    // Update the booking status to 'checked-out'
    booking.status = 'checked-out';
    await booking.save(); // Save the updated booking

    // Respond with the updated booking
    return res.status(200).json({ message: 'Check-Out updated successfully.', booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while updating the booking.', error });
  }
};




exports.getBookingById = async (req, res) => {
  const { bookingId } = req.params; // Extract bookingId from request params
  const { status } = req.query; // Extract status from query params

  try {
    // Build the query object
    const query = { _id:bookingId };
    
    // If status is provided, add it to the query
    if (status) {
      query.status = status;
    }

    // Find the booking by bookingId and status (if provided)
    const booking = await Booking.findOne(query)
      .populate('guest')        // Populate the guest details
      .populate('roomType')     // Populate roomType details
      .populate('room');        // Populate the room details

    // If booking is not found
    if (!booking) {
      return res.status(400).json({ message: 'Booking not found or status does not match.' });
    }
        // The S3 bucket name from your environment or hard-coded value
        const bucketName = S3_BUCKET_NAME;

      // Generate pre-signed URLs for the roomType photos
      if (booking.roomType && booking.roomType.photos && booking.roomType.photos.length > 0) {
        booking.roomType.photos = booking.roomType.photos.map(photoUrl => {
          // Extract the key from the full S3 URL
          const parsedUrl = url.parse(photoUrl);
          const keyName = parsedUrl.pathname.substring(1); // Remove the leading '/' from the path
  
          // Generate a pre-signed URL using the extracted key
          return s3.generatePresignedUrl(bucketName, keyName);
        });
      }

      // Find available rooms for the roomType (assumed available status is stored in room model)
    const availableRooms = await Room.find({
      type: booking.roomType._id,
      status:"available"
    });

    // Create an availableRooms object
    const availableRoomsObj = availableRooms.map(room => ({
      _id: room._id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      status: room.status
    }));

    // Add availableRooms to the booking response
    const response = {
      ...booking._doc, // Use _doc to get the plain object from Mongoose document
      availableRooms: availableRoomsObj // Attach availableRooms array
    };


    // Respond with the booking details
    return res.status(200).json(response);
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: 'An error occurred while retrieving the booking.', error });
  }
};



