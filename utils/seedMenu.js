import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from '../models/Menu.js';
import connectDB from '../config/db.js';

dotenv.config();

const menuData = [
  // ============================================
  // PIZZAS
  // ============================================
  {
    name: 'Margritta',
    category: 'pizza',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    sizes: [
      { name: 'Pan', priceMultiplier: 1 },
      { name: 'Cheese Burst', priceMultiplier: 1.5 },
    ],
    toppings: [], // Plain pizza - no preselected toppings
    isAvailable: true,
  },
  {
    name: 'Fancy Pizza',
    category: 'pizza',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    sizes: [
      { name: 'Pan', priceMultiplier: 1 },
      { name: 'Cheese Burst', priceMultiplier: 1.5 },
    ],
    toppings: [
      { name: 'Corn', price: 5 },
      { name: 'Paneer', price: 5 },
      { name: 'Mushroom', price: 5 },
    ],
    isAvailable: true,
  },
  {
    name: 'Veggie Pizza',
    category: 'pizza',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400',
    sizes: [
      { name: 'Pan', priceMultiplier: 1 },
      { name: 'Cheese Burst', priceMultiplier: 1.5 },
    ],
    toppings: [
      { name: 'Capsicum', price: 5 },
      { name: 'Onion', price: 5 },
      { name: 'Corn', price: 5 },
      { name: 'Tomato', price: 5 },
    ],
    isAvailable: true,
  },
  {
    name: 'All Toppings Pizza',
    category: 'pizza',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    sizes: [
      { name: 'Pan', priceMultiplier: 1 },
      { name: 'Cheese Burst', priceMultiplier: 1.5 },
    ],
    toppings: [
      { name: 'Paneer', price: 5 },
      { name: 'Mushroom', price: 5 },
      { name: 'Corn', price: 5 },
      { name: 'Capsicum', price: 5 },
      { name: 'Onion', price: 5 },
      { name: 'Tomato', price: 5 },
    ],
    isAvailable: true,
  },

  // ============================================
  // DRINKS
  // ============================================
  {
    name: 'Cold Coffee',
    category: 'drinks',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    sizes: [],
    toppings: [],
    isAvailable: true,
  },
  {
    name: 'Hot Chocolate',
    category: 'drinks',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400',
    sizes: [],
    toppings: [],
    isAvailable: true,
  },

  // ============================================
  // SIDES
  // ============================================
  {
    name: 'Pizza Pockets',
    category: 'sides',
    basePrice: 5,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    sizes: [],
    toppings: [],
    isAvailable: true,
  },
  {
    name: 'Calzone',
    category: 'sides',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    sizes: [],
    toppings: [],
    isAvailable: true,
  },
  {
    name: 'Burger',
    category: 'sides',
    basePrice: 20,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    sizes: [],
    toppings: [],
    isAvailable: true,
  },
];

const seedMenu = async () => {
  try {
    console.log('🌱 Starting menu seed process...\n');

    // Connect to database
    await connectDB();

    // Check existing items
    const existingItems = await Menu.find({});
    console.log(`📊 Found ${existingItems.length} existing menu items in database\n`);

    // Clear existing menu (optional - comment out if you want to keep existing items)
    // await Menu.deleteMany({});
    // console.log('🗑️  Cleared existing menu items\n');

    // Insert new items with duplicate prevention
    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of menuData) {
      // Check if item already exists by name
      const exists = await Menu.findOne({ name: item.name });

      if (exists) {
        console.log(`⏭️  Skipped: ${item.name} (already exists)`);
        skippedCount++;
      } else {
        await Menu.create(item);
        console.log(`✅ Inserted: ${item.name} (${item.category})`);
        insertedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`✨ Total items processed: ${menuData.length}`);
    console.log(`✅ New items inserted: ${insertedCount}`);
    console.log(`⏭️  Items skipped: ${skippedCount}`);
    console.log('='.repeat(50) + '\n');

    // Display menu summary
    const pizzas = await Menu.find({ category: 'pizza' });
    const drinks = await Menu.find({ category: 'drinks' });
    const sides = await Menu.find({ category: 'sides' });

    console.log('📂 CURRENT MENU SUMMARY:');
    console.log(`   🍕 Pizzas: ${pizzas.length}`);
    console.log(`   🥤 Drinks: ${drinks.length}`);
    console.log(`   🍔 Sides: ${sides.length}`);
    console.log(`   📊 Total: ${pizzas.length + drinks.length + sides.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SEED FAILED:');
    console.error(error);
    process.exit(1);
  }
};

// Run seed function
seedMenu();
