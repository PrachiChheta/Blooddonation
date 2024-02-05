import mongoose, { Mongoose } from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: "String",
    required: true,
  },
  lastName: {
    type: "String",
    required: true,
  },
  username: {
    type: "String",
    required: true,
    unique: true,
  },
  gender: {
    type: "String",
    required: true,
  },
  password: {
    type: "String",
    required: true,
  },
  dob: {
    type: "Date",
    required: true,
  },
  phone: {
    type: "Number",
  },
  address: {
    type: "String",
  },
  userBloodGroup: {
    type: String,
    required: true,
  },
  donations: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "donation",
    },
  ],
});

const user = mongoose.model("user", userSchema);
export default user;
