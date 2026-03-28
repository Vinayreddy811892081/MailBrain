// resetPassword.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "aaacc@gmail.com"; // user to reset
    const plainPassword = "12345678"; // new password

    const hash = await bcrypt.hash(plainPassword, 12);

    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hash } },
    );

    if (result.modifiedCount) {
      console.log(`✅ Password reset for ${email}`);
    } else {
      console.log(`⚠️ User ${email} not found or password already matches`);
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
