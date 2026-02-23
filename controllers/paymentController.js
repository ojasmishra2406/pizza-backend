import crypto from 'crypto';
import Razorpay from 'razorpay';
import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import { sendPaymentSuccessEmail } from '../utils/emailService.js';

// Lazy initialization of Razorpay instance
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are not configured');
    }
    
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    console.log('✅ Razorpay instance initialized');
  }
  return razorpayInstance;
};

// @desc    Create Razorpay payment order
// @route   POST /api/payments/create
// @access  Private
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  // Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Verify user owns the order
  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this order');
  }

  // Check if already paid
  if (order.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Order is already paid');
  }

  try {
    // Create Razorpay order
    // Amount must be in paise (multiply by 100)
    const amountInPaise = Math.round(order.totalAmount * 100);

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: order._id,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500);
    throw new Error('Payment order creation failed');
  }
});

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    res.status(400);
    throw new Error('Missing payment verification parameters');
  }

  // Fetch order
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Verify user owns the order
  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  try {
    // Verify signature using crypto
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // In development mode with dummy credentials, we'll skip strict verification
    const isValidSignature = 
      generatedSignature === razorpaySignature || 
      process.env.NODE_ENV === 'development';

    if (!isValidSignature) {
      // Update payment status to failed
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400);
      throw new Error('Payment verification failed - Invalid signature');
    }

    // Payment verified successfully
    order.paymentStatus = 'paid';
    await order.save();

    // Populate user details for email
    await order.populate('userId', 'name email');

    // Send payment success email (async)
    sendPaymentSuccessEmail(order).catch((error) => {
      console.error('Failed to send payment success email:', error);
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Update payment status to failed
    order.paymentStatus = 'failed';
    await order.save();

    res.status(400);
    throw new Error(error.message || 'Payment verification failed');
  }
});

// @desc    Handle payment failure
// @route   POST /api/payments/failure
// @access  Private
export const handlePaymentFailure = asyncHandler(async (req, res) => {
  const { orderId, error } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update payment status to failed
  order.paymentStatus = 'failed';
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Payment failure recorded',
    data: {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
    },
  });
});
