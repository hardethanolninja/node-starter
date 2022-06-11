const crypto = require('crypto');
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
  role: {
    type: String,
    enum: ['user', 'guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please choose a password'],
    minlength: [8, 'Passwords must have at least 8 characters'],
    //will hide this field from response
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
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

//middleware function will run between data receive and data save to database
userSchema.pre('save', async function (next) {
  //"this" refers to current document (user)
  if (!this.isModified('password')) return next();

  //hash the password, second parameter is salt length
  this.password = await bcrypt.hash(this.password, 12);

  //deletes the password confirm from the DB, no longer needed
  this.passwordConfirm = undefined;

  next();
});

//middleware to update passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //puts passwordChangedAt to current date minus 5 seconds to adjust for token being created slightly beofre this runs
  this.passwordChangedAt = Date.now() - 5000;
  next();
});

//instance method to determine if password is correct compared to hashed password
userSchema.methods.correctPassword = async function (
  //original password from user
  candidatePassword,
  //hashed password from DB
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//instance method to determine password age
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  //default catch for old users or no passwordChangedAt
  return false;
};

//create password reset token
userSchema.methods.createPasswordResetToken = function () {
  //creats a random string of characters to be sent by email
  const resetToken = crypto.randomBytes(32).toString('hex');

  //secures the token by hashing it before storing it in the DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log('reset token', { resetToken });
  console.log('password reset token', this.passwordResetToken);

  //set expiration date for token, 10 minutes from now
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

//must be last thing in the model
const User = mongoose.model('User', userSchema);

module.exports = User;
