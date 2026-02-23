import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import Menu from '../models/Menu.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

// @desc    Create new order with server-side price recalculation
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryLocation, paymentMethod = 'ONLINE' } = req.body;

  // Validation
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  if (!deliveryLocation || deliveryLocation.trim() === '') {
    res.status(400);
    throw new Error('Delivery location is required');
  }

  // Validate payment method
  if (!['ONLINE', 'COD'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('Invalid payment method');
  }

  // Server-side price recalculation - NEVER trust frontend totals
  const recalculatedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    // Fetch menu item from database
    const menuItem = await Menu.findById(item.menuItemId);

    if (!menuItem) {
      res.status(404);
      throw new Error(`Menu item not found: ${item.menuItemId}`);
    }

    if (!menuItem.isAvailable) {
      res.status(400);
      throw new Error(`Menu item is not available: ${menuItem.name}`);
    }

    // Extract base price with numeric safety
    const basePrice = Number(menuItem.basePrice) || 0;

    // Validate and get size multiplier
    let sizeMultiplier = 1;
    let selectedSize = null;

    if (item.selectedSize) {
      const size = menuItem.sizes.find((s) => s.name === item.selectedSize.name);
      if (!size) {
        res.status(400);
        throw new Error(`Invalid size: ${item.selectedSize.name} for ${menuItem.name}`);
      }
      sizeMultiplier = Number(size.priceMultiplier) || 1;
      selectedSize = {
        name: size.name,
        priceMultiplier: sizeMultiplier,
      };
    }

    // Validate and calculate toppings total with numeric safety
    let toppingsTotal = 0;
    const selectedToppings = [];

    if (item.selectedToppings && item.selectedToppings.length > 0) {
      for (const selectedTopping of item.selectedToppings) {
        const topping = menuItem.toppings.find((t) => t.name === selectedTopping.name);
        if (!topping) {
          res.status(400);
          throw new Error(`Invalid topping: ${selectedTopping.name} for ${menuItem.name}`);
        }
        const toppingPrice = Number(topping.price) || 0;
        toppingsTotal += toppingPrice;
        selectedToppings.push({
          name: topping.name,
          price: toppingPrice,
        });
      }
    }

    // Calculate unit price: basePrice × multiplier + toppingsTotal
    const unitPrice = (basePrice * sizeMultiplier) + toppingsTotal;

    // Validate quantity
    const quantity = parseInt(item.quantity);
    if (!quantity || quantity < 1) {
      res.status(400);
      throw new Error('Invalid quantity');
    }

    // Calculate total price for this item
    const itemTotalPrice = unitPrice * quantity;

    // Add to recalculated items
    recalculatedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      selectedSize,
      selectedToppings,
      quantity,
      unitPrice,
      totalPrice: itemTotalPrice,
    });

    // Add to order total
    totalAmount += itemTotalPrice;
  }

  // Create order
  const order = await Order.create({
    userId: req.user._id,
    items: recalculatedItems,
    deliveryLocation: deliveryLocation.trim(),
    totalAmount,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
    orderStatus: 'placed',
  });

  // Populate user details for email
  await order.populate('userId', 'name email');

  // Send order confirmation email (async, don't wait)
  sendOrderConfirmationEmail(order).catch((error) => {
    console.error('Failed to send order confirmation email:', error);
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id })
    .sort({ createdAt: -1 }) // Latest first
    .populate('items.menuItemId', 'name category image');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.menuItemId', 'name category image');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Ensure user can only view their own orders (unless admin)
  if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'name email')
    .populate('items.menuItemId', 'name category image');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Update order status (Admin only)
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const validStatuses = ['placed', 'preparing', 'dispatched', 'delivered'];
  if (!validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = orderStatus;
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});
