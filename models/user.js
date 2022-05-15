const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
    },

    email : {
        type : String,
        required : true,
    },

    phonenumber : {
        type : String,
        required : true,
    },

    password : {
        type : String,
        required : true,
    },
 
    matchIds: [
        {
            type : String,
            trim : true,
            lowercase : true
        }
    ],

    numberOfContestJoined : {
        type: Number,
        required: true,
        default: 0
    },

    numberOfContestWon : {
        type: Number,
        required: true,
        default: 0
    },

    numberOfTeamsCreated : {
        type: Number,
        required: true,
        default: 0
    },

    totalAmountWon : {
        type: Number,
        required: true,
        default: 0
    },

    wallet : {
        type: Number,
        required: true,
        default: 0
    },

    contact_id : {
        type : String,
        required : true,
        unique : true,
    },

    ifsc : {
        type : String
    }, 

    accountNumber:{
        type : String
    },

    fundId:{
        type: String
    },

    followers : [
        {
            type : String,
            trim : true,
        }
    ],
    
    following : [
        {
            type : String,
            trim : true,
        }
    ]

},{
    timestamps : true
},
);

const User = mongoose.model('User',userSchema);
module.exports = User;