const Matches = require('../models/match');
const LiveMatches = require('../models/match_live_details');
const flagURLs = require('country-flags-svg');
var express = require('express')
const router = express.Router()
const everydayboys = require('./addlivescores')
const messageBird = require('messagebird')('W2tTRdqV8xxNjMYhIXSX3eEY6');
const User=require('../models/user')
const activatekey = 'accountactivatekey123';




router.post('/register',async (req, res)=>{
    console.log(req.body)
    User.findOne({email : req.body.email}, function(err , user){
        if(err){
            req.flash('error','Something went wrong, please sign-up again');
            res.status(200).json({
                'message':'something went wrong'
              });
            }
           
    if(!user){console.log(req.body.phonenumber,'iuytr')
    const phone=req.body.phonenumber
                messageBird.verify.create(phone, {
                    template: "Your Verification code is %token."
                }, function(err, resp){
                    console.log(resp)
                    if(err){
                        console.log(err)
                        res.status(200).json({
                            'message':'something went wrong'
                          });
                        }
                    else{
                    res.status(200).json({
                        'id':resp
                      });
                    }
                    })
                }

else{
    res.status(200).json({
        'message':'useralreadyexists',
      });
    }
})
})

router.post('/otp',async (req, res)=>{
    console.log(req.body)

    res.status(200).json({
        'upcoming':'upcomingMatches',
      });
})

module.exports = router;