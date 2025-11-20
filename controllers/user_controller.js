const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const activatekey = "accountactivatekey123";
const nodemailer = require("nodemailer");
const request = require("request");
const smtpTransport = require("nodemailer-smtp-transport");
const otpGenerator = require("otp-generator");
const { OAuth2Client } = require("google-auth-library");
const unirest = require("unirest");
const path = require("path");
const fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const transaction = require("../updating/transaction_details_controller");
const User = require("../models/user");
const { messaging } = require("../utils/firebaseinitialize");
const axios = require("axios");
const Config = require("../models/config");
const clips = require('../overs_with_clips.json');
const Clip = require("../models/clips");
//const folderPath = "./clips_folder"; // change to your actual folder path
const folderPath = "./latest"


const transporter = nodemailer.createTransport(
  smtpTransport({
    host: process.env.smtp_host,
    port: process.env.smtp_port,
    secure: true,
    auth: {
      user: process.env.smtp_email,
      pass: process.env.smtp_password,
    },
  })
);

const client = new OAuth2Client(
  "438326678548-td4f7iss3q98btacu17h57mpi8tpn7cq.apps.googleusercontent.com"
);

const clientId =
  "438326678548-td4f7iss3q98btacu17h57mpi8tpn7cq.apps.googleusercontent.com";

// Generate unique username
async function generateUniqueUsername() {
  const adjectives = ["crazy", "savage", "sly", "mighty", "legend", "quick", "silent", "epic", "bold"];
  const cricketTerms = ["CoverDrive", "Googly", "Sixer", "Yorker", "SpinKing", "RunMachine", "WicketHero", "FantasyGod"];

  for (let i = 0; i < 10; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const term = cricketTerms[Math.floor(Math.random() * cricketTerms.length)];
    const number = Math.floor(100 + Math.random() * 900); // 3-digit

    const username = `${adj}${term}${number}`;
    const existing = await User.findOne({ username });

    if (!existing) return username;
  }

  throw new Error("Couldn't generate a unique username.");
}

// Generate unique phone number (Indian-style dummy)
async function generateUniquePhoneNumber() {
  for (let i = 0; i < 10; i++) {
    const phone = "7" + Math.floor(100000000 + Math.random() * 900000000).toString(); // 10-digit, starts with 7
    const existing = await User.findOne({ phonenumber: phone });

    if (!existing) return `${phone}`;
  }

  throw new Error("Couldn't generate a unique phone number.");
}


router.post("/googlelogin", async (req, res, next) => {
  const { tokenId } = req.body;
  const verifyObject = {};
  verifyObject.idToken = tokenId;
  verifyObject.audience = clientId;
  const response = await client.verifyIdToken(verifyObject);
  const { email_verified } = response.payload;
  if (email_verified) {
    const usert = await User.findOne({
      email: { $eq: response.payload.email },
    });
    if (usert) {
      usert.image = response.payload.picture;
      await usert.save();
      const userid = usert._id;
      const server_token = jwt.sign({ userid }, activatekey, {
        expiresIn: "5000000m",
      });
      res.status(200).json({
        success: true,
        usert,
        server_token,
      });
    } else {
      const phoneNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const user1 = new User();
      const userId = response.payload.email.split("@")[0];
      user1.userId = userId;
      user1.username = response.payload.name;
      user1.email = response.payload.email;
      user1.image = response.payload.picture;
      user1.password = "password";
      user1.phonenumber = phoneNumber;
      user1.verified = true;
      user1.wallet = 10000;
      const options = {
        method: "POST",
        url: "https://api.razorpay.com/v1/contacts",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic cnpwX3Rlc3RfT0N0MTBGeGpuWFROV0s6RlpyNW9YQjFCWnFtbDBhUlRhd0IwSUh1",
        },
        body: JSON.stringify({
          name: response.payload.name,
          email: response.payload.email,
          contact: 7259293140,
          type: "employee",
          reference_id: "Domino Contact ID 12345",
          notes: {
            random_key_1: "Make it so.",
            random_key_2: "Tea. Earl Grey. Hot.",
          },
        }),
      };
      let contact_id = "";
      const promise = new Promise((resolve, reject) => {
        request(options, (error, response) => {
          if (error) reject(error);
          const s = JSON.parse(response.body);
          contact_id = s.id;
          user1.contact_id = contact_id;
          resolve();
        });
      });
      promise
        .then(async () => {
          User.findOne({ email: response.payload.email }, async (err, user) => {
            if (err) {
              res.status(400).json({
                message: "something went wrong",
              });
            }
            if (!user) {
              transaction.createTransaction(userId, "", 100, "extra cash");
              User.create(user1, async (err, user) => {
                if (err) {
                  console.log(err, 'errr')
                  res.status(400).json({
                    message: "something went wrong",
                  });
                } else {
                  const userid = user._id;
                  const token = jwt.sign({ userid }, activatekey, {
                    expiresIn: "500000m",
                  });
                  res.status(200).json({
                    success: true,
                    user,
                    server_token: token,
                  });
                }
              });
            } else {
              res.status(200).json({
                message: "user already exists",
                success: false,
              });
            }
          });
        })
        .catch((err) => {
          console.log(`Error : ${err}`);
        });
    }
  } else {
    res.json({
      status: 403,
      message: "Email Not Verified, use another method to login!",
    });
  }
});

function checkloggedinuser(req, res, next) {
  const tokenheader = req.body.headers || req.headers.servertoken;

  if (tokenheader) {
    jwt.verify(tokenheader, activatekey, (err, decoded) => {
      if (!err) {
        req.body.uidfromtoken = decoded.userid;
      }
      next();
    });
  } else {
    res.status(200).json({
      success: false,
    });
  }
}

router.post("/register", async (req, res) => {
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const user1 = new User();
  const userId = req.body.email.split("@")[0];
  user1.userId = userId;
  user1.username = req.body.username;
  user1.email = req.body.email;
  user1.password = req.body.password;
  user1.phonenumber = req.body.phoneNumber;
  user1.wallet = 10000;
  user1.otp = otp;

  const options = {
    method: "POST",
    url: "https://api.razorpay.com/v1/contacts",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic cnpwX3Rlc3RfT0N0MTBGeGpuWFROV0s6RlpyNW9YQjFCWnFtbDBhUlRhd0IwSUh1",
    },
    body: JSON.stringify({
      name: req.body.username,
      email: req.body.email,
      contact: req.body.phoneNumber,
      type: "employee",
      reference_id: "Domino Contact ID 12345",
      notes: {
        random_key_1: "Make it so.",
        random_key_2: "Tea. Earl Grey. Hot.",
      },
    }),
  };
  let contact_id = "";
  const promise = new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (error) reject(error);
      const s = JSON.parse(response.body);

      contact_id = s.id;

      user1.contact_id = contact_id;
      resolve();
    });
  });
  promise
    .then(async () => {
      User.findOne({ email: req.body.email }, async (err, user) => {
        if (err) {
          console.log(err, "Error in finding user in Sign-in ");
          res.status(400).json({
            message: "something went wrong",
          });
        }

        if (!user) {
          transaction.createTransaction(userId, "", 100, "extra cash");
          User.create(user1, async (err, user) => {
            if (err) {
              console.log(err, "err");
              res.status(400).json({
                message: "The username or phone number is already registered. Please try a different one.",
              });
            }
            else {
              const userid = user._id;

              const token = jwt.sign({ userid }, activatekey, {
                expiresIn: "5000000m",
              });

              res.status(200).json({
                message: "you are registered successfully.please log in!",
                success: true,
              });
            }
          });
        } else if (!user.verified) {
          user.otp = otp;
          await user.save();
          res.status(200).json({
            message: "registered successfully! please login",
            success: true,
          });
        } else {
          res.status(200).json({
            message: "user already exists,please log in",
            success: false,
          });
        }
      });
    })
    .catch((err) => { });
});

router.post("/registerold", async (req, res) => {
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const user1 = new User();
  const userId = req.body.email.split("@")[0];
  user1.userId = userId;
  user1.username = req.body.username;
  user1.email = req.body.email;
  user1.password = req.body.password;
  user1.phonenumber = req.body.phoneNumber;
  user1.wallet = 10000;
  user1.otp = otp;
  const config = await Config.findOne({});
  const appName = config?.name ? config?.name : 'fantasy11'
  const mailOptions = {
    from: process.env.smtp_email,
    to: req.body.email,
    subject: "Your OTP for Account Verification",
    text: `Hey!

Here’s your OTP: ${otp}

Use this code to finish setting up your account. It expires in 10 minutes.

If you didn’t request this, just ignore this email.

Cheers,
${appName} Team`,
  };

  const options = {
    method: "POST",
    url: "https://api.razorpay.com/v1/contacts",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic cnpwX3Rlc3RfT0N0MTBGeGpuWFROV0s6RlpyNW9YQjFCWnFtbDBhUlRhd0IwSUh1",
    },
    body: JSON.stringify({
      name: req.body.username,
      email: req.body.email,
      contact: req.body.phoneNumber,
      type: "employee",
      reference_id: "Domino Contact ID 12345",
      notes: {
        random_key_1: "Make it so.",
        random_key_2: "Tea. Earl Grey. Hot.",
      },
    }),
  };
  let contact_id = "";
  const promise = new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (error) reject(error);
      const s = JSON.parse(response.body);

      contact_id = s.id;

      user1.contact_id = contact_id;
      resolve();
    });
  });
  promise
    .then(async () => {
      User.findOne({ email: req.body.email }, async (err, user) => {
        if (err) {
          console.log("Error in finding user in Sign-in ");
          res.status(400).json({
            message: "something went wrong",
          });
        }

        if (!user) {
          transaction.createTransaction(userId, "", 100, "extra cash");
          User.create(user1, async (err, user) => {
            if (err) {
              console.log(err, "err");
              // res.status(400).json({
              //   message: err,
              // });
              if (err.code === 11000 && err.keyPattern && err.keyValue) {
                let message = "";
                if (err.keyPattern.phonenumber) {
                  message = "The phone number is already registered.";
                } else if (err.keyPattern.username) {
                  message = "The username is already registered.";
                } else if (err.keyPattern.email) {
                  message = "The email is already registered.";
                } else {
                  message = "The username or phone number is already registered. Please try a different one.";
                }
                res.status(400).json({
                  message: message,
                });
              }
              else {
                res.status(400).json({
                  message: "The username or phone number is already registered. Please try a different one.",
                });
              }
            } else {
              const userid = user._id;
              const token = jwt.sign({ userid }, activatekey, {
                expiresIn: "5000000m",
              });
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log(`Email sent: ${info.response}`);
                }
              });
              res.status(200).json({
                message:
                  "enter otp recieved on your mail to activate your account",
                success: true,
              });
            }
          });
        } else if (!user.verified) {
          user.otp = otp;
          await user.save();
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`Email sent: ${info.response}`);
            }
          });
          res.status(200).json({
            message: "enter otp recieved on your mail to activate your account",
            success: true,
          });
        } else {
          res.status(400).json({
            message: "user already exists,please log in",
            success: false,
          });
        }
      });
    })
    .catch((err) => { });
});
router.post("/otp", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (parseInt(user.otp) == parseInt(req.body.otp)) {
    user.verified = true;
    const userid = user._id;
    const token = jwt.sign({ userid }, activatekey, {
      expiresIn: "5000000m",
    });
    user.save((err) => {
      if (!err) {
        res.status(200).json({
          message: "ure account created successfully u can login",
          token,
          user
        });
      } else {
        res.status(400).json({
          message: "ure account failed to creat successfully"
        });
      }
    });
  } else {
    res.status(400).json({
      message: "ure account failed to create successfully",
    });
  }
});

router.post('/phoneRegister', async (req, res) => {
  try {
    // Extract property details from the request body
    const {
      phoneNumber
    } = req.body;


    // Check if the user is authenticated and has a valid token

    // Check if the user has the role of "owner" in the database

    // Create a new user document with the provided userId and images
    if (phoneNumber) {
      var digits = "0123456789";
      let otp_length = 6;
      let OTP = "";
      for (let i = 0; i < otp_length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }

      // Save the user to the database
      const userFound = await User.findOne({ phonenumber: phoneNumber });
      if (!userFound) {
        const user = new User({
          role: 'User',
          phonenumber: phoneNumber,
          otp: '000000'
        });
        await user.save();
      }
      else {
        userFound.otp = '000000';
        await userFound.save();
      }
      var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");

      req.query({
        "authorization": process.env.fast2sms,
        "message": `enter this otp for logging in: ${'000000'}`,
        "language": "english",
        "route": "q",
        "numbers": `${phoneNumber}`
      });

      req.headers({
        "cache-control": "no-cache"
      });
      req.end(function (res) {
        if (res.error) throw new Error(res.error);
      });
      return res.status(201).json({ success: 'ok', message: 'OTP sent successfully successfully.' });
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(200).json({ success: 'ok', message: 'Failed to create booking.' });
  }
});


router.post('/phoneLogin', async (req, res) => {
  console.log('request');
  try {
    // Extract property details from the request body
    const {
      phoneNumber
    } = req.body;

    console.log(phoneNumber, 'phone number');
    // Check if the user is authenticated and has a valid token

    // Check if the user has the role of "owner" in the database

    // Create a new user document with the provided userId and images
    if (phoneNumber) {
      var digits = "0123456789";
      let otp_length = 6;
      let OTP = "";
      for (let i = 0; i < otp_length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
      // Save the user to the database
      const userFound = await User.findOne({ phonenumber: phoneNumber });
      const users = await User.find();
      if (!userFound) {
        const user = new User({
          username: `powerplay${users.length}`,
          role: 'User',
          phonenumber: phoneNumber,
          otp: OTP,
          contact_id: phoneNumber
        });
        await user.save();
      }
      else {
        userFound.otp = OTP;
        await userFound.save();
      }
      var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");

      req.query({
        "authorization": process.env.fast2sms,
        "message": `enter this otp for logging in: ${OTP}`,
        "language": "english",
        "route": "q",
        "numbers": `${phoneNumber}`
      });

      req.headers({
        "cache-control": "no-cache"
      });
      req.end(function (res) {
        if (res.error) {
          console.log(res.error, 'error')
          throw new Error(res.error);
        }
      });
      return res.status(201).json({ success: 'ok', message: 'OTP sent successfully successfully.' });
    }
    else {
      return res.status(400).json({ success: 'false', message: 'Enter number' });
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(400).json({ success: 'false', message: 'Failed to create booking.' });
  }
});

router.post("/verifyPhoneOtp", async (req, res) => {
  try {
    const { otp, phoneNumber } = req.body;
    console.log(req.body, 'verify otp')
    // Find the user by username
    const user = await User.findOne({ phonenumber: phoneNumber.split('+91')[1] });
    console.log(user)
    // Check if the user exists and the password matches
    if (user) {
      // Generate a JWT token with an expiration date and include the user's ID in the payload
      const userid = user._id;
      const token = jwt.sign({ userid }, activatekey, {
        expiresIn: "500000m",
      });
      // Send a response with the token, user's _id, message, and expiration time
      return res.status(200).json({
        success: 'ok',
        userId: user._id,
        role: user.role,
        token: token,
        user: user,
        message: 'Login successful.',
        expiresIn: '50000000m',
      });
    }
    else {
      return res.status(400).json({ message: 'OTP is wrong.' });
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(400).json({ message: 'OTP is wrong.' });
  }
});

router.get("/forgot-password/:email", async (req, res) => {
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const config = await Config.findOne({});
  const name = config?.name ? config?.name : 'fantasy11'
  try {
    const user1 = await User.findOne({ email: req.params.email });

    if (user1) {
      user1.otp = otp;
      const mailOptions = {
        from: process.env.smtp_email,
        to: req.params.email,
        subject: "Reset Your Password",
        text: `Dear User,

We received a request to reset your password for your account. Please use the following OTP to reset your password:

OTP: ${otp}

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Thank you,
The ${name} Team`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
        } else {
        }
      });
      await user1.save();
      const userid = user1._id;
      const token = jwt.sign({ userid }, activatekey, {
        expiresIn: "500m",
      });

      res.status(200).json({
        message: "enter otp recieved on your mail to activate your account",
        success: true,
      });
    } else {
      res.status(200).json({
        message: "could not send",
        success: false,
      });
    }
  } catch (err) {
    res.status(200).json({
      message: "their was some error",
      success: false,
    });
  }
});

router.post("/forgot-password-otp", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (parseInt(user.otp) == parseInt(req.body.otp)) {
    const userid = user._id;
    const token = jwt.sign({ userid }, activatekey, {
      expiresIn: "500m",
    });
    user.save((err) => {
      if (!err) {
        res.status(200).json({
          message: "u can change your password",
          token,
          success: true,
        });
      } else {
        res.status(200).json({
          message: "found some error",
          success: false,
        });
      }
    });
  } else {
    res.status(200).json({
      message: "entered otp is wrong",
    });
  }
});

router.post("/changepassword", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  user.password = req.body.password;
  user.save((err) => {
    if (!err) {
      res.status(200).json({
        message: "password changed successfully please login",
        success: true,
      });
    } else {
      res.status(200).json({
        message: "could not change password",
        success: false,
      });
    }
  });
});

router.post("/updateUpi", checkloggedinuser, async (req, res) => {
  const user = await User.findOne({ _id: req.body.uidfromtoken });
  user.upiId = req.body.upiId;
  user.save((err) => {
    if (!err) {
      res.status(200).json({
        message: "user upi updated successfully",
        success: true,
      });
    } else {
      res.status(200).json({
        message: "could not update upi",
        success: false,
      });
    }
  });
});

router.post("/updateBank", checkloggedinuser, async (req, res) => {
  const user = await User.findOne({ _id: req.body.uidfromtoken });
  user.accountNumber = req.body.accountNumber;
  user.ifsc = req.body.IFSCcode
  user.save((err) => {
    if (!err) {
      res.status(200).json({
        message: "user upi updated successfully",
        success: true,
      });
    } else {
      res.status(200).json({
        message: "could not update upi",
        success: false,
      });
    }
  });
});

router.post("/updateUser", checkloggedinuser, async (req, res) => {
  const user = await User.findOne({ _id: req.body.uidfromtoken });
  user.username = req.body.username;
  user.country = req.body.country
  user.save((err) => {
    if (!err) {
      res.status(200).json({
        message: "user updated successfully",
        success: true,
      });
    } else {
      res.status(200).json({
        message: "could not update user",
        success: false,
      });
    }
  });
});

// Update user by ID or phone/email (adjust according to your auth system)
router.put("/updateProfile/:userId", async (req, res) => {
  const { userId } = req.params;
  const {
    username,
    email,
    phonenumber,
    dateOfBirth,
    country,
    state,
    city,
    wallet,
    cryptoWallet,
    // Add other fields you want to allow update
  } = req.body;
  console.log(req.body, 'req body');
  try {
    // Build the update object dynamically
    const updateData = {};

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phonenumber !== undefined) updateData.phonenumber = phonenumber;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (wallet !== undefined) updateData.wallet = wallet;
    if (cryptoWallet !== undefined) updateData.cryptoWallet = cryptoWallet;

    // Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/getuser/:id", async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (user) {
    res.status(200).json({
      user: user,
      success: true,
    });
  } else {
    res.status(200).json({
      message: "could not change password",
      success: false,
    });
  }
});

router.get("/gettodayusers", async (req, res) => {
  var start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const users = await User.find({
    createdAt: { $gte: new Date(start), $lt: new Date(end) },
  });
  res.status(200).json({
    message: "teams got successfully",
    users,
  });
});

router.get("/getallusers", async (req, res) => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const startDate = date.toISOString();
  date.setDate(date.getDate() + 1);
  const endDate = date.toISOString();
  const users = await User.find();
  res.status(200).json({
    message: "users got successfully",
    users: users
  });
});

router.post("/logine", async (req, res) => {
  const user = await User.findOne({ email: req.body.myform.email });
  if (user) {
    if (user.password == req.body.myform.password) {
      const userid = user._id;
      const token = jwt.sign({ userid }, activatekey, {
        expiresIn: "50000000m",
      });
      res.status(200).json({
        message: "success",
        token,
        user,
      });
    } else {
      res.status(400).json({
        message: "password is wrong",
      });
    }
  } else {
    res.status(400).json({
      message: "no user exists",
    });
  }
});

router.get("/loaduser", checkloggedinuser, async (req, res) => {
  try {
    const user = await User.findOne({ _id: { $eq: req.body.uidfromtoken } });
    res.status(200).json({
      message: user,
    });
  }
  catch (err) {
    res.status(400).json({
      message: "their was some error",
      success: false,
    });
  }
});

router.post("/save-token", async (req, res) => {
  console.log(req.body, 'body')
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ message: "User ID and token are required." });
  }

  try {
    // Find the user by ID and update the fcmtoken field
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    messaging.subscribeToTopic(token, 'live-updates')
    user.fcmtoken = token; // Save the FCM token in the user's document
    await user.save();

    res.status(200).json({ message: "FCM token saved successfully." });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({ message: "Error saving FCM token.", error });
  }
});

router.get("/githublogin", async (req, res, next) => {
  const code = req.query.code;
  const tokenId = code;
  try {
    // Step 3: Exchange code for access token
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenRes.data.access_token;
    //console.log(tokenRes.data, 'data')
    // Step 4: Fetch GitHub user
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    //console.log(userRes, 'github user')
    const githubUser = userRes.data;
    const email = githubUser?.email ? githubUser?.email : `info@${githubUser?.login}.com`;
    const name = githubUser?.name ? githubUser?.name : githubUser?.login;
    if (email) {
      const usert = await User.findOne({
        email: { $eq: githubUser.email },
      });
      if (usert) {
        usert.image = githubUser.avatar_url;
        await usert.save();
        const userid = usert._id;
        const server_token = jwt.sign({ userid }, activatekey, {
          expiresIn: "5000000m",
        });
        res.status(200).json({
          success: true,
          usert,
          server_token,
        });
      } else {
        const user1 = new User();
        const phoneNumber = await generateUniquePhoneNumber();
        console.log(phoneNumber, 'phonenumber')
        const userId = email.split("@")[0];
        user1.userId = userId;
        user1.username = name;
        user1.email = email;
        user1.image = githubUser.avatar_url;
        user1.password = "password";
        user1.phonenumber = phoneNumber;
        user1.verified = true;
        user1.wallet = 10000;
        const options = {
          method: "POST",
          url: "https://api.razorpay.com/v1/contacts",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic cnpwX3Rlc3RfT0N0MTBGeGpuWFROV0s6RlpyNW9YQjFCWnFtbDBhUlRhd0IwSUh1",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            contact: 7259293140,
            type: "employee",
            reference_id: "Domino Contact ID 12345",
            notes: {
              random_key_1: "Make it so.",
              random_key_2: "Tea. Earl Grey. Hot.",
            },
          }),
        };
        let contact_id = "";
        const promise = new Promise((resolve, reject) => {
          request(options, (error, response) => {
            if (error) reject(error);
            const s = JSON.parse(response.body);
            contact_id = s.id;
            user1.contact_id = contact_id;
            resolve();
          });
        });
        promise
          .then(async () => {
            User.findOne({ email: githubUser.email }, async (err, user) => {
              if (err) {
                res.status(400).json({
                  message: "something went wrong",
                });
              }
              if (!user) {
                transaction.createTransaction(userId, "", 100, "extra cash");
                User.create(user1, async (err, user) => {
                  if (err) {
                    res.status(400).json({
                      message: "something went wrong",
                      error: err
                    });
                  } else {
                    const userid = user._id;
                    const token = jwt.sign({ userid }, activatekey, {
                      expiresIn: "500000m",
                    });
                    res.status(200).json({
                      success: true,
                      user,
                      server_token: token,
                    });
                  }
                });
              } else {
                res.status(200).json({
                  message: "user already exists",
                  success: false,
                });
              }
            });
          })
          .catch((err) => {
            //console.log(`Error : ${err}`);
          });
      }
    } else {
      res.json({
        status: 403,
        message: "Email Not Verified, use another method to login!",
      });
    }
  }
  catch (error) {
    // console.error("Error during GitHub login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
);


async function addclips() {
  //await Clip.deleteMany({})
  //await Clip.insertMany(clips);
  //const clipse = await Clip.find();
  //console.log(clips, clips?.length)
}

//addclips()

// Save or update config by name
router.post("/", async (req, res) => {
  try {
    //await Config.deleteMany({});
    const config = await Config.findOne({});
    //if (!config) {
    //  return res.status(400).json({ success: false, message: "Config not initialized" });
    //}
    if (config) {
      if (req.body.name) config.name = req.body.name;
      if (req.body.tier) config.tier = req.body.tier;

      await config.save();
      res.json({ success: true, config });
    }
    else {
      await Config.create({
        name: req.body.name,
        tier: req.body.tier,
      });
      res.json({ success: true, message: "Config created successfully" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Update failed" });
  }

});

// Get all config entries
router.get("/", async (req, res) => {
  try {
    const configs = await Config.find();
    res.status(200).json({ success: true, configs });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch configs" });
  }
});

// ✅ CREATE a single clip
router.post("/", async (req, res) => {
  try {
    const clip = new Clip(req.body);
    const savedClip = await clip.save();
    res.status(201).json(savedClip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ READ all clips
router.get("/allclips", async (req, res) => {
  try {
    const clips = await Clip.find().sort({ createdAt: 1 });
    res.json(clips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ READ a single clip by ID
router.get("/getclip/:id", async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);
    if (!clip) return res.status(404).json({ error: "Clip not found" });
    res.json(clip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE a clip
router.put("/update-clip/:id", async (req, res) => {
  try {
    const updatedClip = await Clip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedClip) return res.status(404).json({ error: "Clip not found" });
    res.json(updatedClip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE a clip
router.delete("/delete-clip/:id", async (req, res) => {
  try {
    const clip = await Clip.findByIdAndDelete(req.params.id);
    if (!clip) return res.status(404).json({ error: "Clip not found" });
    if (clip.clip) {
      const filePath = path.join(__dirname, "..", "allclips", path.basename(clip.clip));
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Failed to delete file:", filePath, err.message);
      });
    }
    res.json({ message: "Clip deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ BULK INSERT (from earlier)
router.post("/bulk-insert", async (req, res) => {
  try {
    const clips = req.body; // Or define statically if needed
    const result = await Clip.insertMany(clips);
    res.status(201).json({ success: true, count: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/delete-multiple", async (req, res) => {
  try {
    const { clips } = req.body;

    if (!Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ success: false, message: "No clips provided" });
    }

    // Delete files from filesystem
    for (const clipName of clips) {
      const filePath = path.join(__dirname, "../allclips", clipName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from MongoDB
    await Clip.deleteMany({ clip: { $in: clips } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete clips error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post('/cut', (req, res) => {
  const { filename, startTime, duration } = req.body;

  const inputPath = path.join(__dirname, '../public/mockvideos', filename);
  const outputFilename = `cut-${Date.now()}-${filename}`;
  const outputPath = path.join(__dirname, '../public/mockvideos', outputFilename);

  ffmpeg(inputPath)
    .setStartTime(startTime) // e.g., "00:00:05"
    .setDuration(duration)   // e.g., 10 (seconds)
    .output(outputPath)
    .on('end', () => {
      res.json({ success: true, file: outputFilename });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ success: false, message: 'Cut failed' });
    })
    .run();
});

router.post('/merge', async (req, res) => {
  console.log(req.body, 'body')
  const { clips } = req.body; // array of filenames, e.g., ["cut-1.mp4", "cut-2.mp4"]
  files = clips
  console.log(clips, files, 'files')
  if (!Array.isArray(files) || files.length < 2) {
    return res.status(400).json({ success: false, message: 'At least two files required to merge' });
  }

  const tempFileList = path.join(__dirname, '../temp_file_list.txt');
  const videoDir = path.join(__dirname, '../allclips');

  // Create FFmpeg input list file
  const listContent = files.map(file => `file '${path.join(videoDir, file)}'`).join('\n');
  fs.writeFileSync(tempFileList, listContent);

  const outputFilename = `merged-${Date.now()}.mp4`;
  const outputPath = path.join(videoDir, outputFilename);

  ffmpeg()
    .input(tempFileList)
    .inputOptions(['-f concat', '-safe 0'])
    .outputOptions('-c copy')
    .output(outputPath)
    .on('end', () => {
      fs.unlinkSync(tempFileList); // clean up
      res.json({ success: true, file: outputFilename });
    })
    .on('error', (err) => {
      console.error(err);
      fs.unlinkSync(tempFileList);
      res.status(500).json({ success: false, message: 'Merge failed', error: err.message });
    })
    .run();
});

async function processFiles() {
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Sort data by time_sec
    data.detected_overs_secondinnings.sort((a, b) => a.time_sec - b.time_sec);

    for (let i = 0; i < data.detected_overs_secondinnings.length; i++) {
      const current = data.detected_overs_secondinnings[i];
      const next = data.detected_overs_secondinnings[i + 1];

      // Calculate duration
      current.duration = next ? next.time_sec - current.time_sec : 0;
      console.log(current, 'current')
      // Save or update in MongoDB
      await Clip.findOneAndUpdate(
        { clip: current.clip }, // assume clip filename is unique
        { $set: { duration: current.duration } },
        { new: true }
      );
    }
    console.log(`Processed: ${file}`);
  }
  console.log("All files processed.");
}

//processFiles().catch(err => {
//  console.error("Error:", err);
//});

async function removeDuplicateClipsWithMissingDuration() {
  const allClips = await Clip.find({});

  const seen = new Map(); // clipName → array of clip docs

  for (const clip of allClips) {
    const key = clip.clip;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key).push(clip);
  }

  let toDelete = [];

  for (const [clipName, entries] of seen.entries()) {
    if (entries.length > 1) {
      const withoutDuration = entries.filter(
        (doc) => doc.duration === undefined || doc.duration === null
      );

      // Only delete if there is at least one with defined duration
      const withDurationExists = entries.some(
        (doc) => doc.duration !== undefined && doc.duration !== null
      );

      if (withDurationExists && withoutDuration.length > 0) {
        toDelete.push(...withoutDuration.map((doc) => doc._id));
      }
    }
  }

  if (toDelete.length > 0) {
    await Clip.deleteMany({ _id: { $in: toDelete } });
    console.log(`🗑️ Deleted ${toDelete.length} duplicate clips missing duration`);
  } else {
    console.log("✅ No duplicates to delete");
  }
}

//removeDuplicateClipsWithMissingDuration()

async function processClip(clipDoc, uploadDir = "allclips", outputDir = "trimmed") {
  if (clipDoc.duration === undefined || clipDoc.duration === null) {
    console.log(`⏭️ Skipping (no duration): ${clipDoc._id}`);
    return;
  }

  if (clipDoc.duration < 2) {
    console.log(`⏭️ Skipping (too short <2s): ${clipDoc._id}`);
    return;
  }

  const inputPath = path.join(uploadDir, clipDoc.clip);
  const outputPath = path.join(outputDir, path.basename(clipDoc.clip));

  if (!fs.existsSync(inputPath)) {
    console.log(`❌ Input file not found: ${inputPath}`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (clipDoc.duration <= 12) {
    // Copy file as-is
    fs.copyFileSync(inputPath, outputPath);
    console.log(`📁 Copied as-is: ${outputPath}`);
    return;
  }

  // Trim to 12s
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setDuration(12)
      .output(outputPath)
      .on("end", () => {
        console.log(`✂️ Trimmed to 12s: ${outputPath}`);
        resolve();
      })
      .on("error", reject)
      .run();
  });
}

async function processAllClips() {
  const clips = await Clip.find({});
  for (const clip of clips) {
    try {
      await processClip(clip);
    } catch (err) {
      console.error(`❌ Error processing ${clip._id}:`, err.message);
    }
  }
}

//processAllClips();

require('dotenv').config();
const { google } = require('googleapis');
const { getkeys } = require("../utils/crickeys");


const serviceAccount = {
  type: "service_account",
  project_id: "dreamelevenclone",
  private_key_id: process.env.private_key_id,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDRiGl2H/tn9MYC\nzAUlUUGLm2Z/DhbRMoBSdKglDysu2Wi6ZyV1UcVEnLGgXOwByfIW8G+d1lamRTZ7\nX2AbhxBd7iWPAt00TQl4L5EVoX7b7Lm24T7fKyQTBbll/vMQAhOia6YjFpaXJ2WS\nCMzeuv0hwfwpGic2Srvm5gldMycc976VlQF1ArLb2hBshNUGQE3XTQbffJNNLBFS\nz9z3TjKGxrUkCZnnlzVkBWewVPjB7f7GyH8NOqgPipuXEl3GqfXblrtT7bCoeb5t\nyEC3hybcZIU2DVPGJtsbz09g6eSnMsN3KGN/Sh8Ikayqg67hnJ75lUCJP0UXFUPq\nvIqq8KiJAgMBAAECggEALHE3ETd6XxPTVe+JHd+su9xDsqo927RO9G5K5cVgXuj9\nJiBPmSE1arajlERxSHXZc9Uej4dRTKX8htF1dJFCvvGOpNUyLvAyFHxeVQyyeBov\nT+NZrwMa/S/nIYOgcWJHYNldXS7i1P+lswJL1egqXZkkD2G9NG5IiZJ8JPj/EEz3\nUVPoGID9nFdCDGZpbhgwX85/Zcf6K97ooumaz2hhmQFBKgInOoOBh9xgsE1Jj8Xw\nExCQ1p5EkxZQe3I1mdWr2Fky59iSNo0uIXBXsojYQUuNe9SMqwoCvQMoIRLzX6ut\nWJbn4gLpmFSKoybb8NIjDtdTCz+sbuwdl2K2210suwKBgQD8hMsi0KKc32EfbdO7\nt+4dWbr2JCPyKXvbslVRjfXi95VQiIZbJCJm5FnBAF/C8fJBgEsV6q5Jv6PkY2CH\nxQitxpB9motvv3nMIQxuiUweiZNPYSOLuypll74aeYTfzihGvZpXMGadvy4isRUa\nz02ehbIrRh1L5z9Pdtmm4ALa7wKBgQDUa+jnMGUqsIiy5oCXt6cSdlqGvYMw666U\nWMTqek/1cJZXKu9yk1atHv6GYZ0zJBLWKlQMfKGUrjut6khV6KullTZb6HwU7dYL\nnHWrby9oA3tm9cuiKuO/gRE2mA3tgwHB5uH5GeYQHxL8Pu1UN8Q8IdDMJ/uNkVK6\nJUwI8l4UBwKBgQDaXXdQjvzgDWduh0ne/gpChVLhAZW4FtmNvaR8Fvf4IsOTVcxh\nyliZg4R+GvW0ngcxT2Ee/cdj7P4sRSe3oNKFe719cIR9ySXpOPcIK2CQ08V4knbr\noZnjKppxSH54D03TBqkOFsPWS/n4dAvdGEF2AQV22HYDKmEcNZm37eVqLwKBgQDK\n7LdWu+25RWGhff/Ub/Zj9bpvQ3Wjc1KYluCumt/tuXt1lCegzc4cniJKH9A7vbdc\n7pzSPPFjBrsuXkRyBU6MZSnDzSlUGQzElNf4SMQB2mm1pxO8PLrLBDJ8c+/COMei\nA71V6X7VYcoSPM8eCBQn2aoMjhmKWQytlNm5JkfnWwKBgQDQanav4FXJKIo/ccEH\nx2QyFn0oxMZfrIPkI14ZxfYQ+clswmAjpaHlVn9pGaR1SHGRMFDqpVZj257GyP8K\nwQzImjawr6dki63AwJAFvfuieKo6BY/iTVmGdol7q2UV7eHQLMm64f9QzR3uREW3\nHctnRWqWMnocga/NWBCG/2QiPA==\n-----END PRIVATE KEY-----\n",
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-46oin%40dreamelevenclone.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function writeToSheet() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1mPE_6GmObeoDlB6bBeqrsdje3owtQFQMZpwSecV4ZGg'; // Replace with your actual Google Sheet ID
  const range = 'Sheet1!A1';

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['Player', 'Score'],
        ['Virat Kohli', 75],
        ['Rohit Sharma', 63],
      ],
    },
  });

  console.log('✅ Data written:', res.statusText);
}

//writeToSheet().catch(console.error);

const SHEET_ID = "1mPE_6GmObeoDlB6bBeqrsdje3owtQFQMZpwSecV4ZGg";
const SHEET_NAME = "Sheet1";

// Google Auth setup
const sheets = google.sheets({ version: "v4", auth });

// Step 1: Fetch Google Sheet rows
async function getSheetData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:D`, // Adjust columns
  });
  return res.data.values;
}

// Step 2: Fetch RapidAPI matchDetails
async function fetchAllMatchDetails() {
  //const key=await getkeys()
  const response = await axios.get("https://cricbuzz-cricket.p.rapidapi.com/series/v1/3472", {
    headers: {
      "X-RapidAPI-Key": "77cac70752msh1ce13ec8cd5c240p1160fbjsn5e68d56cf5a5",
      "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
    },
  });

  const details = [];
  //console.log(response.data,'data')
  for (const detail of response.data.matchDetails) {
    const dateRange = Object.keys(detail.matchDetailsMap || {})[0];
    //const matches = detail.matchDetailsMap[dateRange] || [];

    for (let match of response.data.matchDetails) {
      //console.log(match?.matchDetailsMap?.match?.[0], 'match')
      const matchDesc = match?.matchDetailsMap?.match?.[0].matchInfo?.matchDesc;
      const matchId = match?.matchDetailsMap?.match?.[0].matchInfo?.matchId;
      if (matchId && matchDesc) {
        details.push({ matchDesc, matchId });
      }
    }
  }
  // console.log(details,'details')
  return details;
}

// Step 3: Update Google Sheet with matchIds
async function updateMatchIdsInSheet(rows, matchDetails) {
  const values = [];
  console.log(rows, 'existing rows')
  for (let i = 0; i < rows.length; i++) {
    const [existingMatchId, matchName] = rows[i];
    //console.log(matchDetails?.[i]?.matchDesc?.toLowerCase(), rows[i]?.[3]?.includes(`m0${matchDetails?.[i]?.matchDesc?.toLowerCase()?.split('match').join('')?.split('th ').join('')?.split('st ').join('')}`), 'match details')
    if (rows[i]?.[3]?.includes(`m0${matchDetails?.[i]?.matchDesc?.toLowerCase()?.split('match').join('')?.split('th ').join('')?.split('st ').join('')}`)) {
      const { matchId } = matchDetails[i];
      values.push([matchId, matchDetails[i].matchDesc]);
    }
    else if ('a' == 'a') {
      //console.log(matchDetails?.length,'length')
      let xyz;
      for (let a = 0; a < matchDetails.length; a++) {
        if (rows[i]?.[3]?.includes(`m${matchDetails?.[a]?.matchDesc?.toLowerCase()?.split('match').join('')?.split('th ').join('')?.split('st ').join('')}-`)) {
          console.log(rows[i]?.[3]?.includes(`m${matchDetails?.[a]?.matchDesc?.toLowerCase()?.split('match').join('')?.split('th ').join('')?.split('st ').join('')}-`), rows[i]?.[3], `m${matchDetails?.[a]?.matchDesc?.toLowerCase()?.split('match').join('')?.split('th ').join('')?.split('st ').join('')}`, 'match_details')
          const { matchId } = matchDetails[a];
          values.push([matchId, matchDetails[a].matchDesc]);
          xyz = 'found'
          break;
        }
      }
      if (!xyz) {
        values.push(['', '']);
      }
    }
    else {
      values.push(['', '']);
    }
    //console.log(rows[i][3], matchDetails[i]?.matchDesc?.toLowerCase()?.split('match').join('')?.split('th').join(''), 'match_details')
  }
  console.log(values, 'values')
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    //range: `${SHEET_NAME}!A2:A${values.length + 1}`, // matchId column
    range: `${SHEET_NAME}!A1:B${values.length + 1}`, // m
    valueInputOption: "RAW",
    requestBody: { values },
  });

  console.log("✅ Sheet updated with matchIds.");
}

// Final Runner
async function run() {
  const rows = await getSheetData();
  const matchDetails = await fetchAllMatchDetails();
  await updateMatchIdsInSheet(rows, matchDetails);
}

//run().catch(console.error);


async function downloadMatches(matches) {
  for (const match of matches) {
    const safeName = match.matchName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    const fileName = `${safeName}_${match.matchId}.mp4`;

    const command = `yt-dlp -o "${fileName}" "${match.url}"`;
    console.log(`Downloading ${match.matchName}...`);

    try {
      await execPromise(command);
      console.log(`✅ Downloaded: ${fileName}`);
    } catch (err) {
      console.error(`❌ Failed to download ${fileName}`, err.stderr || err);
    }
  }
}

async function download() {
  const rows = await getSheetData();
  const urlsToDownload = rows
    .filter(row => row[3]) // Ensure URL exists
    .map(row => ({
      matchId: row[0],
      matchName: row[1],
      url: row[3],
    }));
  downloadMatches(urlsToDownload)
}

//download()



module.exports = router;
