// Email Service for Order Notifications
// 
// ============================================
// RENDER DEPLOYMENT NOTES
// ============================================
// ENETUNREACH errors occur on Render because:
// 1. IPv6 routing issues - Render's network may attempt IPv6 first, but Gmail SMTP
//    doesn't reliably respond to IPv6 from all cloud providers
// 2. Container cold starts - First connection attempts may timeout due to DNS resolution delays
// 3. Network latency - Cloud platforms have variable network latency vs localhost
// 4. Connection pooling - Stale pooled connections timeout on serverless/container restarts
//
// Solutions implemented:
// ✅ socketOptions.family: 4 - Forces IPv4 connections at socket level
// ✅ pool: false - Creates fresh connections (no stale connection reuse)
// ✅ Extended timeouts - Accounts for cloud network latency (30-45s vs 10s)
// ✅ maxConnections: 1 - Prevents connection pooling issues
// ✅ dnsTimeout - Handles DNS resolution delays on container startup
// ============================================

import nodemailer from 'nodemailer';
import dns from 'dns';

// CRITICAL: Force Node.js DNS to prefer IPv4 (system-level)
// This ensures all DNS lookups return IPv4 addresses first
dns.setDefaultResultOrder('ipv4first');

// Function to create a fresh transporter (no caching to avoid timeout issues)
const getTransporter = () => {
  // Check credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured. Emails will not be sent.');
    return null;
  }

  console.log('📧 [TRANSPORTER] Creating fresh SMTP connection...');

  // ============================================
  // RENDER-OPTIMIZED NODEMAILER CONFIG
  // ============================================
  // Fixes ENETUNREACH errors on cloud platforms
  // by forcing IPv4 and adding generous timeouts
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL on port 465 (avoids Render blocking STARTTLS on 587)
    
    // Disable pooling - create fresh connection per email
    // Prevents stale connection timeouts on serverless/container platforms
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    
    // Authentication
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    
    // TLS Configuration
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs (development)
      ciphers: 'SSLv3',          // Gmail-compatible cipher
      minVersion: 'TLSv1.2',     // Minimum TLS version
    },
    
    // RENDER-SPECIFIC: Generous timeouts for cloud network latency
    connectionTimeout: 30000,  // 30 seconds to establish TCP connection
    greetingTimeout: 30000,    // 30 seconds to receive server greeting
    socketTimeout: 45000,      // 45 seconds for socket inactivity
    
    // DNS and socket configuration
    dnsTimeout: 30000,         // DNS resolution timeout
    
    // CRITICAL FIX: Force IPv4 at socket level for Render
    // This prevents ENETUNREACH errors caused by IPv6 routing failures
    socketOptions: {
      family: 4, // Force IPv4 socket connection
    },
    
    // Logging (enable in production for debugging)
    // logger: process.env.NODE_ENV === 'production',
    // debug: process.env.NODE_ENV !== 'production',
  });

  return transporter;
};

// @desc    Send order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
  console.log('📧 [EMAIL SERVICE] sendOrderConfirmationEmail called');
  console.log('📧 [EMAIL SERVICE] Order ID:', order._id);
  
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.log('⚠️  [EMAIL SERVICE] Skipping - transporter not configured');
      return { success: true, skipped: true };
    }

    console.log('📧 [EMAIL SERVICE] Transporter obtained successfully');

    const { userId, items, deliveryLocation, totalAmount, _id } = order;

    console.log('📧 [EMAIL SERVICE] Order details:', {
      orderId: _id,
      userId: userId?._id || userId,
      userName: userId?.name,
      userEmail: userId?.email,
      itemCount: items?.length,
      totalAmount
    });

    if (!userId || !userId.email) {
      console.error('❌ [EMAIL SERVICE] Missing user email - cannot send email');
      console.error('   userId object:', userId);
      return { success: false, error: 'Missing user email' };
    }

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

    console.log('📧 [EMAIL SERVICE] Sending email to:', emailContent.to);
    
    // Send actual email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      ...emailContent,
    });

    // Log for debugging
    console.log('✅ [EMAIL SERVICE] Email sent successfully!');
    console.log('   To:', emailContent.to);
    console.log('   Subject:', emailContent.subject);
    console.log('   Order ID:', _id);

    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Error sending email:');
    console.error('   Name:', error.name);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack);
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
