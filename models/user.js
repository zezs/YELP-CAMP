const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new Schema({
   fname: {
      type: String,
      required: true,
      unique: true
     },
   lname: {
      type: String,
      required: true,
      unique: true
     },
   roomnumber: {
      type: Number,
      required: true,
      unique: true
     },
   email: {
    type: String,
    required: true,
    unique: true
   }
});

// add to user scheam username(make sure they are unique), passpword
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);