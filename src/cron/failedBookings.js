const cron = require('node-cron');
const Booking = require('../models/Booking');

// Function to delete bookings that have been pending for more than 30 minutes
async function deleteOldBookings() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

  try {
    const result = await Booking.deleteMany({
      status: 'booked',
      paymentType: 'online',
      paymentStatus: 'pending',
      createdAt: { $lt: thirtyMinutesAgo }, // Bookings older than 30 minutes
    });
    
    console.log(`Deleted ${result.deletedCount} bookings.`);
  } catch (error) {
    console.error('Error deleting old bookings:', error);
  }
}

// Schedule the job to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  console.log('Running cron job to delete old bookings...');
  deleteOldBookings();
});
