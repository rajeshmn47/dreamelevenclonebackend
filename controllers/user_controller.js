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
const transaction = require("../updating/transaction_details_controller");
const User = require("../models/user");
const { messaging } = require("../utils/firebaseinitialize");
const Config = require("../models/config");
const axios = require("axios");

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
      const user1 = new User();
      const userId = response.payload.email.split("@")[0];
      user1.userId = userId;
      user1.username = response.payload.name;
      user1.email = response.payload.email;
      user1.image = response.payload.picture;
      user1.password = "password";
      user1.phonenumber = 7259293140;
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

module.exports = router;
