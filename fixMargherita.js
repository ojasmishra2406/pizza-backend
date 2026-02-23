// Quick fix script to rename Margritta to Margherita Pizza
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from './models/Menu.js';
import connectDB from './config/db.js';

dotenv.config();

const fixMargherita = async () => {
  try {
    console.log('🔧 Fixing Margherita pizza name...\n');

    await connectDB();

    // Find the misspelled item
    const item = await Menu.findOne({ name: 'Margritta' });

    if (item) {
      console.log('✅ Found "Margritta" - updating to "Margherita Pizza"');
      item.name = 'Margherita Pizza';
      await item.save();
      console.log('✅ Updated successfully!\n');
    } else {
      console.log('⚠️  "Margritta" not found in database');
      console.log('   Checking if "Margherita Pizza" already exists...\n');
      
      const exists = await Menu.findOne({ name: 'Margherita Pizza' });
      if (exists) {
        console.log('✅ "Margherita Pizza" already exists - no action needed');
      } else {
        console.log('❌ Neither found - you may need to reseed the database');
      }
    }

    // Show all pizzas
    const pizzas = await Menu.find({ category: 'pizza' });
    console.log('\n📜 Current Pizzas:');
    pizzas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (₹${p.basePrice}) - ${p.isAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixMargherita();
