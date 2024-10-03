const Hotel = require('../models/Hotel');
const sendEmail = require('../utils/email');

// Function to create a new hotel
const createHotel = async (req, res) => {
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

module.exports = {
  createHotel
};
