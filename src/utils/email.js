const SibApiV3Sdk = require('@sendinblue/client');

import dotenv from 'dotenv';
import { S3_BUCKET_NAME } from '../utils/constants';
dotenv.config();

// Initialize the API client and set up the API key
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set up the API key from environment variables
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Create a reusable function to send emails
const sendEmail = async (toEmail, subject, content) => {
  const emailData = {
    sender: { email: 'developer.krishnasaiyeturu@gmail.com', name: 'Krishna Sai' },
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: content, // HTML or plain text content
  };

  try {
    const data = await apiInstance.sendTransacEmail(emailData);
    console.log('Email successfully sent:');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


module.exports = sendEmail;
