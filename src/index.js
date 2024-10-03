import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { createHotel } from './controller/HotelController';
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postsRoutes = require('./routes/postsRoutes');
const commentsRoutes = require('./routes/commentsRoutes');
const middlewares = require('./middleware/middlewares');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const ErrorResponse = require('./middleware/ErrorResponse');

dotenv.config();

const port = process.env.PORT || 4000;

const startServer = async () => {
  const app = express();

  await mongoose.connect(process.env.MONGO_URI);

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

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use(ErrorResponse);
  app.use('/api/auth', userRoutes);
  app.use('/api/room', roomRoutes);
  app.use('/admin', adminRoutes);
  app.use('/posts', postsRoutes);
  app.use('/comments', commentsRoutes);

  // Define default hotel data
  const defaultHotel = {
    name: 'Grand Luxury Hotel',
    location: {
      address: '123 Luxury Street',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      postalCode: '90001'
    },
    contact: {
      phone: '+1-234-567-890',
      email: 'contact@grandluxuryhotel.com'
    },
    amenities: ['Free Wi-Fi', 'Pool', 'Gym', 'Spa'],
    rating: 5,
  };

  // Create hotel during initialization
  createHotel(defaultHotel);

  app.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:${port}`)
  );

  app.use(middlewares.notFound);
  app.use(middlewares.errorHandler);
};

startServer();
