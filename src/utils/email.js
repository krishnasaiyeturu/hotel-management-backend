const SibApiV3Sdk = require('@sendinblue/client');

import dotenv from 'dotenv';
import { HOTEL_AREA, HOTEL_EMAIL, HOTEL_NAME, S3_BUCKET_NAME } from '../utils/constants';
dotenv.config();

// Initialize the API client and set up the API key
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set up the API key from environment variables
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Create a reusable function to send emails
const sendEmail = async (toEmail, subject, content) => {
  let bccEmails;
  if(process.env.NODE_ENV === "production"){
    bccEmails = [HOTEL_EMAIL,'developer.krishnasaiyeturu@gmail.com'];
  }else{
    bccEmails = ['developer.krishnasaiyeturu@gmail.com'];
  }

  const emailData = {
    sender: { email: HOTEL_EMAIL, name: `${HOTEL_NAME}-${HOTEL_AREA}` },
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: content, // HTML or plain text content
    bcc: bccEmails.map(email => ({ email }))
  };

  try {
    const data = await apiInstance.sendTransacEmail(emailData);
    console.log('Email successfully sent:');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


module.exports = sendEmail;
