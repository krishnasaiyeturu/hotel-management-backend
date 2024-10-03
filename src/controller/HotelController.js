const Hotel = require('../models/Hotel');
const sendEmail = require('../utils/email');

// Function to create a new hotel
exports.createHotel = async (req, res) => {
  try {

    // Destructure request body to get the required hotel data
    const {
      name,
      location,
      contact,
      amenities,
      rating
    } = req;

    // Check if the hotel already exists to avoid duplicates
    const existingHotel = await Hotel.findOne({ name: name });

    if (existingHotel) {
      // async function triggerEmail() {
      //   try {
      //     // await sendEmail('krishnasaiyeturu@gmail.com', 'Test Subject', '<h1>This is a test email</h1>');
      //     console.log('Email sent successfully');
      //   } catch (error) {
      //     console.error('Failed to send email:', error);
      //   }
      // }
      
      // triggerEmail();
    console.log(`Hotel "${name}" already exists.`);
    return {status:400, message: `Hotel "${name}" already exists.` };

    }

    // Create a new hotel using the Hotel model
    const newHotel = await Hotel.create({
      name,
      location,
      contact,
      amenities,
      rating
    });

    // Respond with the created hotel
    return{
        status:200,
      success: true,
      data: newHotel
    };
  } catch (error) {
    // Handle any errors that occur during hotel creation
    return {
      status:400,
      success: false,
      message: error.message || 'Error creating the hotel'
    };
  }
};

// Get all hotels
exports.getAllHotels = async (req, res) => {
  try {
    // Retrieve all hotels from the database, selecting only the name and ID
    const hotels = await Hotel.find().select('_id name'); // Use .select() to specify fields

    // If no hotels found
    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: 'No hotels found' });
    }

    // Respond with the list of hotels (only ID and name)
    res.status(200).json(hotels);
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: 'No hotels found', error: error.message });
  }
};
