const Transaction = require("../models/transaction");

module.exports.createTransaction = async function (
  userId,
  transactionId,
  amount,
  action
) {
  const transaction = new Transaction();
  transaction.userId = userId;
  transaction.transactionId = transactionId;
  transaction.amount = amount;
  transaction.action = action;
  try {
    const newTransaction = await Transaction.create(transaction);
    if (newTransaction) {
      console.log("Transaction added in Database");
      return true;
    }
  } catch (err) {
    console.log(`Error : ${err}`);
  }
  return false;
};
