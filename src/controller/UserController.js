const User = require('../models/User');
const { tryCatch } = require('../utils/tryCatch');

exports.getUsers = tryCatch(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ users });
});

exports.register = tryCatch(async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role
  });

  const token = user.getSignedJwt();

  res.status(201).json({
    success: true,
    token,
    user
  });
});

exports.login = tryCatch(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next({
      message: 'Please provide valid email and password.'
    });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next({
      message: 'Invalid Credentials'
    });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next({
      message: 'Invalid Credentials'
    });
  }

  const token = user.getSignedJwt();

  res.status(201).json({
    success: true,
    token,
    userId: user._id
  });
});


// Controller to handle user creation
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check for required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  // Validate role
  const validRoles = ['receptionist', 'manager', 'admin', 'housekeeping', 'maintenance'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.create({
      name,
      email,
      password, // Ensure to hash the password using pre-save middleware
      role
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


