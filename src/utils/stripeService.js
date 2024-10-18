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



exports.createPaymentSession = async (bookingId,amount, currency = 'usd') => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: currency, product_data: { name: 'Item' }, unit_amount: Math.round(amount * 100) }, quantity: 1, metadata: { bookingId: bookingId }, }],
      mode: 'payment',
      success_url: 'https://your-site.com/success',
      cancel_url: 'https://your-site.com/cancel',
    });
    
    return { success: true, sessionId: session.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


