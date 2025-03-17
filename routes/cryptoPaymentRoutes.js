const express = require("express");
const {Web3} = require("web3");
const dotenv = require("dotenv");
const Transaction = require("../models/transaction");
const fs = require('fs');
const path = require('path');

dotenv.config();

const router = express.Router();

var web3Provider = new Web3.providers.HttpProvider(process.env.POLYGON_AMOY_RPC);
const web3 = new Web3(web3Provider);
const DBC_CONTRACT_ADDRESS = process.env.DBC_CONTRACT;
const DBC_ABI = JSON.parse(fs.readFileSync(path.resolve('config', 'dbcAbi.json'), 'utf8')); // ABI file of DBC contract

const dbcContract = new web3.eth.Contract(DBC_ABI, DBC_CONTRACT_ADDRESS);

const connectWallet = async (req, res) => {
    try {
        const { address } = req.body;
        if (!web3.utils.isAddress(address)) {
            return res.status(400).json({ error: "Invalid wallet address" });
        }
        res.json({ success: true, message: "Wallet connected", address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getBalance = async (req, res) => {
    try {
        const address = req.params.address;
        if (!web3.utils.isAddress(address)) {
            return res.status(400).json({ error: "Invalid wallet address" });
        }

        const balance = await dbcContract.methods.balanceOf(address).call();
        res.json({ success: true, balance: web3.utils.fromWei(balance, "ether") });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const depositDBC = async (req, res) => {
    try {
        const { userAddress, amount, txHash } = req.body;
        if (!web3.utils.isAddress(userAddress) || !txHash) {
            return res.status(400).json({ error: "Invalid request" });
        }

        const transaction = new Transaction({
            userAddress,
            type: "deposit",
            amount,
            txHash,
            status: "pending"
        });

        await transaction.save();
        res.json({ success: true, message: "Deposit initiated", transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const withdrawDBC = async (req, res) => {
    try {
        const { userAddress, amount } = req.body;
        if (!web3.utils.isAddress(userAddress) || amount <= 0) {
            return res.status(400).json({ error: "Invalid request" });
        }

        const transaction = new Transaction({
            userAddress,
            type: "withdraw",
            amount,
            txHash: "PENDING",
            status: "pending"
        });

        await transaction.save();
        res.json({ success: true, message: "Withdrawal request recorded", transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendDBC = async (req, res) => {
    try {
      const { sender, recipient, amount } = req.body;
  
      if (!web3.utils.isAddress(sender) || !web3.utils.isAddress(recipient)) {
        return res.status(400).json({ success: false, error: "Invalid wallet address" });
      }
  
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        return res.status(400).json({ success: false, error: "Private key not found in backend" });
      }
  
      const amountInWei = web3.utils.toWei(amount, "ether");
  
      // 🟢 Fetch Gas Price from Network
      const gasPrice = await web3.eth.getGasPrice(); // Auto gas price fetch
      const gasLimit = 200000; // Standard gas limit
  
      // 🟢 Create Transaction Object with Gas Fees
      const tx = {
        from: sender,
        to: DBC_CONTRACT_ADDRESS,
        gas: gasLimit,
        gasPrice: gasPrice, // Gas price set kiya
        data: dbcContract.methods.transfer(recipient, amountInWei).encodeABI(),
      };
  
      // 🔹 Sign Transaction
      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
  
      // 🔹 Send Signed Transaction
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  
      // 🔹 Store Transaction in MongoDB
      const transaction = new Transaction({
        userAddress: sender,
        type: "send",
        amount,
        txHash: receipt.transactionHash,
        status: "success",
      });
  
      await transaction.save();
  
      res.json({ success: true, txHash: receipt.transactionHash });
  
    } catch (error) {
      console.error("Transaction failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

// Define routes
router.post("/connectWallet", connectWallet);
router.get("/getBalance/:address", getBalance);
router.post("/depositDBC", depositDBC);
router.post("/withdrawDBC", withdrawDBC);
router.post("/sendDBC", sendDBC);

module.exports = router;