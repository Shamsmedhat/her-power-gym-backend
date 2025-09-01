const User = require('../models/userModel');

// Helper function to validate if there any duplication
const handleDuplication = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.errorResponse.keyPattern)[0];
    return `User with this ${field} is already exists!`;
  }
  return error.message;
};

const generateUniqueUserId = async (phone, role) => {
  const lastThree = (phone || '').replace(/\D/g, '').slice(-3).padStart(3, '0');

  // Determine prefix based on role
  let prefix;
  switch (role) {
    case 'super-admin':
      prefix = 'SA';
      break;
    case 'admin':
      prefix = 'AD';
      break;
    case 'coach':
      prefix = 'CO';
      break;
    default:
      prefix = 'UR'; // fallback for any other roles
  }

  // Try up to 20 times to avoid rare collisions
  for (let i = 0; i < 20; i += 1) {
    const randomTwo = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    const candidate = `${prefix}${lastThree}${randomTwo}`;
    const exists = await User.exists({ userId: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Failed to generate a unique userId. Please try again.');
};

module.exports = { handleDuplication, generateUniqueUserId };
