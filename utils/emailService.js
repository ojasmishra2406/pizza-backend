// Email Service for Order Notifications
import nodemailer from 'nodemailer';

// Function to get or create transporter (lazily initialized)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Debug: Log email credentials (masked)
    console.log('Initializing Email Config:', {
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}***` : 'NOT SET',
      pass: process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET'
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  Email credentials not configured. Emails will not be sent.');
      return null;
    }

    // Configure email transporter
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // use TLS
      family: 4, // Force IPv4 to avoid IPv6 connection issues
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    transporter.verify(function (error, success) {
      if (error) {
        console.log('❌ Email configuration error:', error.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  }
  return transporter;
};

// @desc    Send order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [EMAIL] Skipping order confirmation - email not configured');
      return { success: true, skipped: true };
    }

    const { userId, items, deliveryLocation, totalAmount, _id } = order;

    const itemsList = items
      .map(
        (item) =>
          `- ${item.name} ${item.selectedSize ? `(${item.selectedSize.name})` : ''} x ${item.quantity} = ₹${item.totalPrice.toFixed(2)}`
      )
      .join('\n');

    const emailContent = {
      to: userId.email,
      subject: `Order Confirmation - #${_id}`,
      text: `
Hello ${userId.name},

Your order has been placed successfully!

Order ID: ${_id}
Delivery Location: ${deliveryLocation}

Items:
${itemsList}

Total Amount: ₹${totalAmount.toFixed(2)}

Payment Status: Pending

We'll notify you once payment is confirmed.

Thank you for ordering with us!

Best regards,
Pizza App Team
      `,
    };

    // Send actual email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      ...emailContent,
    });

    // Log for debugging
    console.log('📧 [EMAIL] Order Confirmation Sent:');
    console.log(`   To: ${emailContent.to}`);
    console.log(`   Subject: ${emailContent.subject}`);
    console.log(`   Order ID: ${_id}`);
    console.log(`   Total: ₹${totalAmount.toFixed(2)}`);

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// @desc    Send payment success email
export const sendPaymentSuccessEmail = async (order) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [EMAIL] Skipping payment confirmation - email not configured');
      return { success: true, skipped: true };
    }

    const { userId, items, deliveryLocation, totalAmount, _id } = order;

    const itemsList = items
      .map(
        (item) =>
          `- ${item.name} ${item.selectedSize ? `(${item.selectedSize.name})` : ''} x ${item.quantity} = ₹${item.totalPrice.toFixed(2)}`
      )
      .join('\n');

    const emailContent = {
      to: userId.email,
      subject: `Payment Successful - Order #${_id}`,
      text: `
Hello ${userId.name},

Your payment has been confirmed! 🎉

Order ID: ${_id}
Delivery Location: ${deliveryLocation}

Items:
${itemsList}

Total Amount Paid: ₹${totalAmount.toFixed(2)}

Payment Status: Paid ✓
Order Status: ${order.orderStatus}

Your order is now being processed. You'll receive updates as it progresses.

Track your order in the Orders section of your account.

Thank you for your payment!

Best regards,
Pizza App Team
      `,
    };

    // Send actual email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      ...emailContent,
    });

    // Log for debugging
    console.log('📧 [EMAIL] Payment Success Sent:');
    console.log(`   To: ${emailContent.to}`);
    console.log(`   Subject: ${emailContent.subject}`);
    console.log(`   Order ID: ${_id}`);
    console.log(`   Amount: ₹${totalAmount.toFixed(2)}`);
    console.log(`   Status: PAID ✓`);

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// @desc    Send order status update email
export const sendOrderStatusEmail = async (order, newStatus) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [EMAIL] Skipping status update - email not configured');
      return { success: true, skipped: true };
    }

    const { userId, _id } = order;

    const statusMessages = {
      placed: 'Your order has been placed',
      preparing: 'Your order is being prepared',
      dispatched: 'Your order has been dispatched',
      delivered: 'Your order has been delivered',
    };

    const emailContent = {
      to: userId.email,
      subject: `Order Update - #${_id}`,
      text: `
Hello ${userId.name},

${statusMessages[newStatus]}!

Order ID: ${_id}
Status: ${newStatus}

Track your order in the Orders section.

Best regards,
Pizza App Team
      `,
    };

    // Send actual email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      ...emailContent,
    });

    // Log for debugging
    console.log('📧 [EMAIL] Order Status Update:');
    console.log(`   To: ${emailContent.to}`);
    console.log(`   Order ID: ${_id}`);
    console.log(`   New Status: ${newStatus}`);

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};
