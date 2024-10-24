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


// must be one of card, acss_debit, affirm, afterpay_clearpay, alipay, au_becs_debit, bacs_debit, bancontact, blik, boleto, cashapp, customer_balance, eps, fpx, giropay, grabpay, ideal, klarna, konbini, link, multibanco, oxxo, p24, paynow, paypal, pix, promptpay, sepa_debit, sofort, swish, us_bank_account, wechat_pay, revolut_pay, mobilepay, zip, amazon_pay, twint, kr_card, naver_pay, kakao_pay, payco, or samsung_pay


// Refactored function to create a Stripe payment session
exports.createPaymentSession = async (bookingId, amount,otherDetails, currency = 'usd') => {
  try {
    // Prepare the session configuration
    const sessionConfig = {
      payment_method_types: ['card','amazon_pay','affirm','cashapp','link','klarna'], // Specify allowed payment methods
      line_items: [
        {
          price_data: {
            currency, // Set the currency dynamically
            product_data: { 
              name: otherDetails?.roomType,
              description:"Welcome to Aspen Grand Hotel in LaPorte, Texas. Our thoughtfully designed rooms feature contemporary amenities and cozy furnishings. Enjoy a complimentary breakfast, relax by the outdoor pool, or stay active in our fitness center. With easy access to parks, shopping, and dining. What sets us apart is our personalized service—our friendly staff is dedicated to making your stay seamless and enjoyable. Discover the charm of LaPorte at Aspen Grand Hotel—your home away from home!",
              images:["https://www.aspenl.com/assets/king-suite-e1fbbd95.jpg"],


             }, // Product name for the booking
            unit_amount: Math.round(amount * 100), // Convert amount to cents
          },
          quantity: otherDetails?.noOfRooms, // Single booking quantity
        },
      ],
      mode: 'payment', // Use payment mode for a one-time payment
      metadata: {
        bookingId: bookingId, // Add metadata with the bookingId
        otherDetails:JSON.stringify(otherDetails)
      },
      success_url: `${process.env.FRONT_END_URL}/payment/suc`, // Redirect URL after success
      cancel_url: `${process.env.FRONT_END_URL}/payment/fail`, // Redirect URL if payment is canceled
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


// Function to create and send the invoice
exports.createInvoice = async (bookingId, otherDetails, amount) => {
  console.log(otherDetails?.guestEmail);
  try {
    // Find or create a Stripe customer using their email
    let customer = await stripe.customers.list({ email: otherDetails?.guestEmail });
    if (customer.data.length === 0) {
      // Create a new customer if one doesn't exist
      customer = await stripe.customers.create({
        email: otherDetails?.guestEmail,
        metadata: { bookingId }
      });
    } else {
      customer = customer.data[0]; // Use existing customer
    }


    console.log(customer.id);

    // Create an invoice item to add to the invoice
    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: amount, // this Amount is in cents
      currency: 'usd', // Default to USD or use the same currency from the payment
      description: `Payment for booking ${bookingId}, Room Type: ${otherDetails.roomType}`
    });

    // Create the invoice for the customer
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: true, // Automatically finalize and send the invoice
      metadata: {
        bookingId: bookingId,
      }
    });

    console.log(invoice);

    // Optionally, finalize the invoice manually if auto_advance is false
    // await stripe.invoices.finalizeInvoice(invoice.id);

    console.log(`Invoice created and sent to ${otherDetails?.guestEmail}`);
  } catch (error) {
    console.error('Error creating invoice:', error.message);
  }
};



