const User = require('../models/User'); // Assuming User model is in the same directory
const bcrypt = require('bcryptjs');

// Guest registration controller
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if the email is already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  try {
    // Create new user
    const newUser = await User.create({
      name,
      email,
      password, // Password will be hashed by the pre-save middleware
      role: 'guest' // Default role for guests
    });

    const token = newUser.getSignedJwt();

    res.status(201).json({
      success: true,
      token,
      userId: newUser._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to register User' });
  }
};
