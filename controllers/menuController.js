import Menu from '../models/Menu.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createMenuItem = asyncHandler(async (req, res) => {
  const { name, category, basePrice, image, sizes, toppings, isAvailable } = req.body;

  if (!name || !category || !basePrice) {
    res.status(400);
    throw new Error('Please provide name, category, and basePrice');
  }

  const validCategories = ['pizza', 'drinks', 'sides'];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category. Must be pizza, drinks, or sides');
  }

  const menuItem = await Menu.create({
    name,
    category,
    basePrice,
    image,
    sizes,
    toppings,
    isAvailable,
  });

  res.status(201).json({
    success: true,
    data: menuItem,
  });
});

export const getAllMenuItems = asyncHandler(async (req, res) => {
  const menuItems = await Menu.find({ isAvailable: true });

  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems,
  });
});

export const getMenuItemsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const validCategories = ['pizza', 'drinks', 'sides'];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category');
  }

  const menuItems = await Menu.find({ category, isAvailable: true });

  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems,
  });
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuItem = await Menu.findById(id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  menuItem.isAvailable = !menuItem.isAvailable;
  await menuItem.save();

  res.status(200).json({
    success: true,
    data: menuItem,
  });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuItem = await Menu.findById(id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  const { name, category, basePrice, image, sizes, toppings, isAvailable } = req.body;

  if (category) {
    const validCategories = ['pizza', 'drinks', 'sides'];
    if (!validCategories.includes(category)) {
      res.status(400);
      throw new Error('Invalid category');
    }
  }

  if (name) menuItem.name = name;
  if (category) menuItem.category = category;
  if (basePrice !== undefined) menuItem.basePrice = basePrice;
  if (image !== undefined) menuItem.image = image;
  if (sizes) menuItem.sizes = sizes;
  if (toppings) menuItem.toppings = toppings;
  if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

  await menuItem.save();

  res.status(200).json({
    success: true,
    data: menuItem,
  });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuItem = await Menu.findById(id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  await menuItem.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Menu item deleted successfully',
  });
});
