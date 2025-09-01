// Helper function to validate if there any duplication
const handleDuplication = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.errorResponse.keyPattern)[0];
    return `User with this ${field} is already exists!`;
  }
  return error.message;
};

module.exports = { handleDuplication };
