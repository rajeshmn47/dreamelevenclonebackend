const express = require("express");
const router = express.Router();
const Kyc = require("../models/kyc");
const Notification = require("../models/notification");

// ----------------------
// User submits KYC URLs
// ----------------------
router.post("/submit", async (req, res) => {
  try {
    const { userId, docs } = req.body;
    if (!userId || !docs || !Array.isArray(docs) || docs.length === 0) {
      return res.status(400).json({ message: "userId and docs array are required" });
    }

    // Check if user already submitted KYC
    const existingKyc = await Kyc.findOne({ userId });
    if (existingKyc) {
      return res.status(400).json({ message: "KYC already submitted" });
    }

    const kyc = new Kyc({
      userId,
      docs,
    });

    await kyc.save();
    // After KYC submission
    await Notification.create({
      userId: userId,      // user who submitted
      recipientType: "admin",          // admin receives this
      type: "kyc",
      title: "New KYC Submission",
      message: `New kyc request!`,
      targetId: kyc._id
    });

    res.status(200).json({ message: "KYC submitted successfully", kyc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Admin fetches all KYC requests
// ----------------------
router.get("/all", async (req, res) => {
  try {
    const kycs = await Kyc.find().populate("userId", "name email");
    res.status(200).json(kycs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Admin verifies/rejects KYC
// ----------------------
router.put("/verify/:id", async (req, res) => {
  try {
    const { status, adminComment } = req.body; // "approved" or "rejected"
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const kyc = await Kyc.findById(req.params.id);
    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    kyc.status = status;
    kyc.verifiedAt = new Date();
    kyc.adminComment = adminComment || "";
    await kyc.save();
    // NOTIFY USER WHO SUBMITTED THE KYC
    await Notification.create({
      recipientId: kyc.userId,          // 👈 notify that user
      recipientType: "user",
      type: "kyc",
      title: `KYC ${status === "approved" ? "Approved" : "Rejected"}`,
      message:
        status === "approved"
          ? "Your KYC has been successfully approved!"
          : "Your KYC was rejected. Please submit again.",
      targetId: kyc._id,
      isRead: false,               // 👈 make sure user sees unread count
    });

    res.status(200).json({ message: "KYC updated successfully", kyc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// User fetches own KYC status
// ----------------------
router.get("/status/:userId", async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.params.userId });
    if (!kyc) return res.status(404).json({ message: "No KYC submitted" });
    res.status(200).json(kyc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
