var express = require('express')
var app = express()
const mongoose = require('mongoose')
const cors = require('cors')
var express = require('express')
const cricLive = require('cric-live');
const home = require('./controllers/homecontroller')
const everyday = require('./controllers/matchDB-controller')
const everydayboy = require('./controllers/addlivedetail')
const everydayboys = require('./controllers/addlivescores')
/* Requiring body-parser package
to fetch the data that is entered
by the user in the HTML form.*/
const bodyParser = require('body-parser')
// Allowing app to use body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
const url = 'http://localhost:3000'
const krl = 'https://stackoverflowclonefrontend.netlify.app'
app.use(cors({ origin:url, credentials: true }))
app.use('/',home)
const uri ='mongodb+srv://rajeshmn47:uni1ver%40se@cluster0.bpxam.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

mongoose.Promise = global.Promise
mongoose.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (error) {
    if (error) {
      console.log('Error!' + error)
    }
  }
)
async function everydaybro(){
await everyday.addMatchtoDb()
}
async function everydayguy(){
  await everydayboys.addLivescorestodb()
  }
  everydayguy()
k=Buffer.from('jwalagutta', 'base64').toString();
const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(k)
  console.warn(`App listening on http://localhost:${PORT}`)
})
