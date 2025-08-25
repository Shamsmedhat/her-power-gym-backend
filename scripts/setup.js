const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const User = require('../models/userModel');
const SubscriptionPlan = require('../models/subscriptionModel');

// Connect to database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log('DB connection successful for setup');
});

// Sample data
const sampleSubscriptionPlans = [
  {
    name: 'Monthly Basic',
    type: 'main',
    durationDays: 30,
    price: 50,
    description: 'Basic monthly gym membership',
  },
  {
    name: 'Yearly Basic',
    type: 'main',
    durationDays: 365,
    price: 500,
    description: 'Basic yearly gym membership with discount',
  },
  {
    name: 'Private Training - 10 Sessions',
    type: 'private',
    totalSessions: 10,
    price: 300,
    description: '10 private training sessions with a coach',
  },
  {
    name: 'Private Training - 20 Sessions',
    type: 'private',
    totalSessions: 20,
    price: 550,
    description: '20 private training sessions with a coach',
  },
];

const sampleUsers = [
  {
    name: 'Super Admin',
    phone: '1234567890',
    password: 'admin123',
    role: 'super admin',
    userId: 'SUPER001',
  },
  {
    name: 'Admin User',
    phone: '1234567891',
    password: 'admin123',
    role: 'admin',
    userId: 'ADMIN001',
  },
  {
    name: 'Coach John',
    phone: '1234567892',
    password: 'coach123',
    role: 'coach',
    userId: 'COACH001',
    salary: 2500,
    daysOff: ['Saturday', 'Sunday'],
  },
  {
    name: 'Coach Sarah',
    phone: '1234567893',
    password: 'coach123',
    role: 'coach',
    userId: 'COACH002',
    salary: 2500,
    daysOff: ['Friday', 'Saturday'],
  },
];

// Setup function
async function setup() {
  try {
    console.log('Starting database setup...');

    // Clear existing data
    await User.deleteMany({});
    await SubscriptionPlan.deleteMany({});

    console.log('Cleared existing data');

    // Create subscription plans
    const createdPlans = await SubscriptionPlan.create(sampleSubscriptionPlans);
    console.log(`Created ${createdPlans.length} subscription plans`);

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await User.create(hashedUsers);
    console.log(`Created ${createdUsers.length} users`);

    console.log('\nSetup completed successfully!');
    console.log('\nSample users created:');
    createdUsers.forEach((user) => {
      console.log(
        `- ${user.name} (${user.role}): Phone: ${user.phone}, Password: ${
          user.password ? 'hashed' : 'N/A'
        }`
      );
    });

    console.log('\nSample subscription plans created:');
    createdPlans.forEach((plan) => {
      console.log(`- ${plan.name}: $${plan.price} (${plan.type})`);
    });

    console.log('\nYou can now start the server with: npm start');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = setup;
