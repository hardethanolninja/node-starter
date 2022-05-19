const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name, email, photo, password, password confirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
  },
  email: {
    type: String,
    required: [true, 'An email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Please choose a password'],
    minlength: [8, 'Passwords must have at least 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    select: false,
    validate: {
      validator: function (el) {
        //this keyword refers to schema
        //this only works on "CREATE" and "SAVE", so "find 1 and update" will not work
        return el === this.password;
      },
      message: 'Passwords must match',
    },
  },
});

//middleware function will run between data receive and data save to database
userSchema.pre('save', async function (next) {
  //this refers to current document (user)
  if (!this.isModified('password')) return next();

  //hash the password, second parameter is salt length
  this.password = await bcrypt.hash(this.password, 12);

  //deletes the password confirm from the DB, no longer needed
  this.passwordConfirm = undefined;

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
