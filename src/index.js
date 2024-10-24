import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
const bodyParser = require('body-parser');
import morgan from 'morgan';
import helmet from 'helmet';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { createHotel } from './controller/HotelController';
import { DEFAULT_HOTEL } from './utils/constants';
import User from './models/User';
import { createUser } from './controller/UserController';
import Booking from './models/Booking';
import { bookingConfirmation } from './email_template/booking_confirmation';
import { createInvoice } from './utils/stripeService';
const sendEmail = require('./utils/email');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postsRoutes = require('./routes/postsRoutes');
const commentsRoutes = require('./routes/commentsRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const middlewares = require('./middleware/middlewares');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const ErrorResponse = require('./middleware/ErrorResponse');

dotenv.config();

const port = process.env.PORT || 4000;

const startServer = async () => {
  const app = express();

  // await mongoose.connect(process.env.MONGO_URI);
  mongoose.set('strictPopulate', false);

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));


  app.use(morgan('dev'));
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    res.json({
      message: 'Hello World'
    });
  });


  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }), // Raw body to verify signature
    async (req, res) => {
      let event = req.body;
      console.log(req?.body?.type);

  
      // Handle the `checkout.session.completed` event
      console.log("event type",event.type)
      if (event.type === 'checkout.session.completed') {
        console.log(event.data.object);
        const session = event.data.object;
        const bookingId = session.metadata.bookingId; // Retrieve booking ID from session metadata
  
        try {
          // Confirm the booking by updating the paymentStatus and bookingStatus
          await Booking.findOneAndUpdate({bookingId}, {
            paymentStatus: 'paid',
          });

          let bookingDetails = JSON.parse(session.metadata.otherDetails);
          //Booking Confirmation Email 
          let email_content = bookingConfirmation(bookingDetails);

          await sendEmail(bookingDetails.guestEmail,`Booking Confirmation ${bookingId}`,email_content);
          // Call the function to create and send an invoice
          console.log("INVOICE DETAILS", bookingId, bookingDetails, session.amount_total)
          await createInvoice(bookingId, bookingDetails, session.amount_total);
  
          console.log('Booking confirmed for ID:', bookingId);
        } catch (error) {
          console.error('Error confirming booking:', error.message);
          return res.status(500).send('Failed to update booking');
        }
      }
  
      // Respond to Stripe to acknowledge receipt of the event
      res.status(200).send({ received: true });
    }
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use(ErrorResponse);
  app.use('/api/auth', userRoutes);
  app.use('/api/room', roomRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/comments', commentsRoutes);


  // Create hotel during initialization
  createHotel(DEFAULT_HOTEL);

  const createInitialUser = async () => {
    try {
      const initialUser = {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: 'admin@123', // Ensure to use a strong password
        role: 'admin' // Make sure 'admin' is a valid role in your ROLES array
      };
  
      // Check if the user already exists
      const existingUser = await User.findOne({ email: initialUser.email });
      if (!existingUser) {
        await createUser({ body: initialUser }, {
          status: (statusCode) => {
            return {
              json: (response) => {
                console.log(`Response: ${JSON.stringify(response)}, Status Code: ${statusCode}`);
              }
            };
          }
        });
      } else {
        console.log('User already exists. Skipping creation.');
      }
    } catch (error) {
      console.error('Error creating initial user:', error);
    }
  };

  // Call the initial user creation function
  createInitialUser();

  // Import cron job
  require('../src/cron/failedBookings'); 

  app.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:${port}`)
  );

  app.use(middlewares.notFound);
  app.use(middlewares.errorHandler);
};

startServer();
