/* eslint-disable no-console */
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(() => console.log("DB connection successfully"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is running in ${PORT}...`);
});
