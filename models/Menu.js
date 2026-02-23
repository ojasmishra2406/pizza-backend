import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['pizza', 'drinks', 'sides'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    image: {
      type: String,
    },
    sizes: [
      {
        name: {
          type: String,
          required: true,
        },
        priceMultiplier: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    toppings: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
