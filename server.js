import express from "express";
import mongoose from "mongoose";

import User from "./schemas/userSchema.js";
import Donation from "./schemas/donationSchema.js";

import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import user from "./schemas/userSchema.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

(app.locals.getDate = function (date) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-in", options);
}),
  //Database connection
  mongoose
    .connect("mongodb://127.0.0.1:27017/blood_donation")
    .then(() => {
      console.log("DB Connected Successfully");
    })
    .catch((err) => console.error(err));

//Home Page
app.get("/", (req, res) => {
  res.render("index");
});

//Signin Page
app.get("/signin", (req, res) => {
  res.render("signin", { message: "" });
});
app.post("/signin", async (req, res) => {
  const body = req.body;

  const result = await User.findOne({ username: body.username });

  if (!result) {
    res.render("signin", {
      message: "User does not exist. Please Sign Up first.",
    });
    return;
  }

  if (body.password !== result.password) {
    res.render("signin", {
      message: "Password entered incorrectly",
    });
    return;
  }

  result.password = "";

  let date = result.dob;
  var now = new Date();
  var current_year = now.getFullYear();
  var year_diff = current_year - date.getFullYear();

  result["age"] = year_diff;
  result["today"] = now.toLocaleDateString("en-in");

  res.render("signin", {
    message: ``,
    user: result,
  });
});

//Signup Page
app.get("/signup", async (req, res) => {
  res.render("signup", { message: "" });
});

app.get("/find", (req, res) => {
  res.render("find", { donors: [], message: "" });
});

app.get("/about", (req, res) => {
  res.render("aboutus");
});

app.post("/find", async (req, res) => {
  const compatibility = {
    "A+": ["A+", "A-", "O+", "O-"],
    "O+": ["O+", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "AB+": ["A+", "A-", "O+", "O-", "B+", "B-", "AB+", "AB-"],
    "A-": ["A-", "O-"],
    "O-": ["O-"],
    "B-": ["B-", "O-"],
    "AB-": ["A-", "O-", "B-", "AB-"],
  };

  let results = await User.find({
    userBloodGroup: { $in: compatibility[req.body.group] },
  }).sort("userBloodGroup");

  results = results.filter((res) => {
    if (res.donations && res.donations.length !== 0) {
      return res;
    }
  });

  if (results.length === 0) {
    res.render("find", { donors: results, message: "No results found" });
    return;
  }

  res.render("find", { donors: results, message: "Results" });
});

app.post("/signup", async (req, res) => {
  const body = req.body;

  const result = await User.findOne({ username: body.username });

  if (result) {
    res.render("signup", {
      message: "Username exists. Please select another",
    });
    return;
  }

  if (body.phone.length !== 10) {
    res.render("signup", {
      message: "Phone number should be of 10 digits",
    });
    return;
  }

  let date = body.dob;
  var now = new Date();
  var current_year = now.getFullYear();
  var year_diff = current_year - date.getFullYear();

  if (year_diff < 16) {
    res.render("signup", {
      message: "Age must be greater than 16 years",
    });
    return;
  }

  if (
    !body.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/)
  ) {
    res.render("signup", {
      message:
        "Password should be atleast 8 characters long, have one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  if (body.password !== body.confirm) {
    res.render("signup", {
      message: "Passwords do not match.",
    });
    return;
  }

  const newUser = new User({
    firstName: body.firstname,
    lastName: body.lastname,
    username: body.username,
    password: body.password,
    address: body.address,
    gender: body.gender,
    phone: body.phone,
    dob: body.dob,
    userBloodGroup: body.group,
  });

  await newUser.save();
  res.render("signup", { message: "User registered successfully" });
});

app.post("/donate", async (req, res) => {
  const body = req.body;
  const donation = new Donation({
    donorId: body.id,
    donorWeight: body.weight,
    donorHeight: body.height,
    donorBloodGroup: body.bgroup,
    donationType: body.type,
  });

  const user = await User.findById(body.id);
  user.donations.push(donation._id);

  await donation.save();
  await user.save();
  res.render("signin", { message: "Donation registered successfully" });
});

app.get("/donations/:userId", async (req, res) => {
  const id = req.params.userId;
  const results = await User.findById(id).populate({
    path: "donations",
    options: { sort: { timeOfDonation: -1 } },
  });
  let date = results.dob;
  var now = new Date();
  var current_year = now.getFullYear();
  var year_diff = current_year - date.getFullYear();
  results["age"] = year_diff;

  console.log(results);
  res.render("donation", { results });
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
