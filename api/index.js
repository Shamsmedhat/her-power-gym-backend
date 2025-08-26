// api/index.js
const app = require('../app');
// Hand off the request to the Express app (no app.listen on Vercel)
module.exports = (req, res) => app(req, res);
