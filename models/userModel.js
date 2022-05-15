const mongoose = require('mongoose');
const validator = require('validator');

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
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
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

const User = mongoose.model('User', userSchema);

module.exports = User;
