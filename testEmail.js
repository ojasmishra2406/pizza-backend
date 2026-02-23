// Test Email Script
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('=== EMAIL TEST STARTING ===\n');

console.log('1. Checking Environment Variables:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 8)}***` : 'NOT SET ❌');
console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 4)}***${process.env.EMAIL_PASSWORD.slice(-4)}` : 'NOT SET ❌');
console.log('');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ ERROR: Email credentials not configured in .env file');
  process.exit(1);
}

console.log('2. Creating Email Transporter...');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4, // Force IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('   ✅ Transporter created\n');

console.log('3. Verifying SMTP Connection...');
transporter.verify(function (error, success) {
  if (error) {
    console.error('   ❌ SMTP Verification Failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('\n   💡 SOLUTION:');
    console.error('   - Generate new Gmail App Password at: https://myaccount.google.com/apppasswords');
    console.error('   - Update EMAIL_PASSWORD in server/.env');
    console.error('   - Make sure 2-Step Verification is enabled on your Google account');
    process.exit(1);
  } else {
    console.log('   ✅ SMTP Connection Verified Successfully!\n');
    
    console.log('4. Sending Test Email...');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🍕 Test Email from Pizza Ordering System',
      text: `
Hello!

This is a test email from your Pizza Ordering System.

If you're reading this, your email configuration is working correctly! ✅

Server Details:
- Timestamp: ${new Date().toLocaleString()}
- SMTP Host: smtp.gmail.com
- Port: 587
- IPv4: Forced

Your email service is ready to send order confirmations! 🎉

Best regards,
Pizza Ordering System
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ff6b6b; border-radius: 10px;">
  <h1 style="color: #ff6b6b;">🍕 Test Email Success!</h1>
  
  <p>Hello!</p>
  
  <p>This is a test email from your <strong>Pizza Ordering System</strong>.</p>
  
  <p>If you're reading this, your email configuration is working correctly! ✅</p>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Server Details:</h3>
    <ul>
      <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
      <li><strong>SMTP Host:</strong> smtp.gmail.com</li>
      <li><strong>Port:</strong> 587</li>
      <li><strong>IPv4:</strong> Forced</li>
    </ul>
  </div>
  
  <p style="color: #28a745; font-weight: bold;">Your email service is ready to send order confirmations! 🎉</p>
  
  <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
  
  <p style="color: #6c757d; font-size: 12px;">
    Best regards,<br>
    Pizza Ordering System
  </p>
</div>
      `
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error('   ❌ Failed to Send Email:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        console.error('\n   Details:', error);
        process.exit(1);
      } else {
        console.log('   ✅ Test Email Sent Successfully!\n');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('   Accepted:', info.accepted);
        console.log('   Rejected:', info.rejected);
        console.log('\n=== EMAIL TEST COMPLETED SUCCESSFULLY ===');
        console.log('✅ Check your inbox:', process.env.EMAIL_USER);
        process.exit(0);
      }
    });
  }
});
