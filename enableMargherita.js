// Enable Margherita Pizza
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from './models/Menu.js';
import connectDB from './config/db.js';

dotenv.config();

const enableMargherita = async () => {
  try {
    console.log('🔓 Enabling Margherita Pizza...\n');

    await connectDB();

    const item = await Menu.findOne({ name: 'Margherita Pizza' });

    if (item) {
      console.log(`Current status: ${item.isAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
      item.isAvailable = true;
      await item.save();
      console.log('✅ Margherita Pizza is now AVAILABLE!\n');
    } else {
      console.log('❌ Margherita Pizza not found');
    }

    // Show all pizzas with availability
    const pizzas = await Menu.find({ category: 'pizza' });
    console.log('📜 All Pizzas:');
    pizzas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (₹${p.basePrice}) - ${p.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

enableMargherita();
