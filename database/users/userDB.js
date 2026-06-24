const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'interviewer'], default: 'candidate' },
  createdAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model('User', userSchema);
module.exports = { UserModel };
