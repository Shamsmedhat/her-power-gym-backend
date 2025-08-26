const connectDB = require('../lib/db');
const app = require('../app');

module.exports = async (req, res) => {
  await connectDB(
    process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  );
  return app(req, res);
};
