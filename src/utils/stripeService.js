const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Ensure you add your secret key to your environment variables

exports.createPaymentIntent = async (bookingId,amount, currency = 'usd') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency: currency,
      metadata: { bookingId: bookingId }, // Pass the booking ID as metadata
    });
    return { success: true, clientSecret: paymentIntent.client_secret };
  } catch (error) {
    return { success: false, error: error.message };
  }
};



// Refactored function to create a Stripe payment session
exports.createPaymentSession = async (bookingId, amount, currency = 'usd') => {
  try {
    // Prepare the session configuration
    const sessionConfig = {
      payment_method_types: ['card'], // Specify allowed payment methods
      line_items: [
        {
          price_data: {
            currency, // Set the currency dynamically
            product_data: { name: 'ROOM' }, // Product name for the booking
            unit_amount: Math.round(amount * 100), // Convert amount to cents
          },
          quantity: 1, // Single booking quantity
        },
      ],
      mode: 'payment', // Use payment mode for a one-time payment
      metadata: {
        bookingId: bookingId, // Add metadata with the bookingId
      },
      success_url: 'http://localhost:5173/success', // Redirect URL after success
      cancel_url: 'http://localhost:5173/cancel', // Redirect URL if payment is canceled
    };

    // Create the payment session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Return the session ID for frontend to handle
    return { success: true, sessionId: session.id };
  } catch (error) {
    // Log error for debugging (optional)
    console.error('Error creating Stripe session:', error);

    // Return error message to caller
    return { success: false, error: error.message };
  }
};


