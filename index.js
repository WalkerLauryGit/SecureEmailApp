const express = require('express')
const https = require('https')
const fs = require('fs')
const { auth, requiresAuth } = require('express-openid-connect')
const sgMail = require('@sendgrid/mail')
const session = require('express-session')
const path = require('path')

// This is for dev only, creates a link in terminal for website
const terminalLink = require('terminal-link')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const multer = require('multer')
const { storage } = require('./cloudinary')
const upload = multer({ storage })

const port = process.env.PORT || 3000;

require('dotenv').config()


// DATABASE MONGOOSE CONNECTION
// Old Connection String mongodb://127.0.0.1:27017/securesend
mongoose.connect(`mongodb+srv://dmad:Copper14@securesend.bwzso.mongodb.net/securesend?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("The database bird has landed")
    })
    .catch(err => {
        console.log(err)
    })

const emailSchema = new mongoose.Schema({
    sender: String,
    recipient: String,
    password: String,
    message: String,
    images: [
        {
            url: String,
            filename: String
        }
    ]

})

const Email = mongoose.model('Email', emailSchema)
// END DATABASE MONGOOSE CONNECTION


const SG_API = process.env.SG_API;

const app = express();

app.use(
    auth({
    authRequired: false,
    auth0Logout: true,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    secret: process.env.SECRET
})
)


sgMail.setApiKey(SG_API)
// app.use(auth(config))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(session({
    secret: 'this is the secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

app.get('/', (req, res) => {
    if(req.oidc.isAuthenticated()){
        res.redirect('/new')
    }else{
    res.render('home')
    }
})

// Page where you see what is retrieved from /document
app.get('/profile', (req, res) => {

    res.render("profile/index", { user: users[0], emails })
})

// Home page where you can create a request
app.get('/new', requiresAuth(), (req, res) => {

    res.render('index')
})

// Page where you can retrieve a document from
app.get('/document', (req, res) => {
    res.render('document', { sender: '', message: '', images: [], err: '' })
})

// Uploads images and message to cloudinary
app.post('/new', upload.array('image'), (req, res) => {


    //Loop over the images in req.files and add the path and url to email

    const images = req.files.map(f => ({ url: f.path, filename: f.filename }))



    const { sender, recipient, password, message } = req.body
    // Left off adding an id to the email value before saving it to the database
    const email = new Email({ sender, recipient, password, message, images })
    email.save()
        .then((e) => {
            console.log(e, "successfully saved")
        })
        .catch(err => console.log(err));


    const from = 'donotreply@sendingsecurely.com'
    const msg = {
        to: recipient,
        from,
        subject: `You have a message waiting from ${sender}`,
        text: message,
        html: `<div>Click the button to be taken to the secure messsage!
                <br> <a style="height: 10px; width: 10px" href="http://sendingsecurely.com/viewer/${email._id}">
                Click here</a></div>
                <div>
                <p>The id of the message is ${email._id}</p>
                <p>The password is ${email.password}</p>
                </div>`
    }

    sgMail.send(msg)
        .then(() => console.log('Email sent successfuly'))
        .catch(err => console.log(err.message))

    res.redirect('/new')
})

// This is what retrieves the actual message and returns the successful or returns nothing
app.post('/viewer', async (req, res) => {
    console.log(req.body)
    const email = await Email.findById(req.body.id)

        .then(response => {
            console.log(response)
            console.log("Success")
            const { sender, message, images, password } = response;
            if (password === req.body.password) {
                res.render(`document`, { sender, message, images, err: '' })
            } else {
                res.render(`document`, { sender: '', message: '', images: [], err: 'Incorrect password' })
            }
        }).catch(err => {
            console.log(err)
            res.render('document', { sender: '', message: '', images: [], err: "Wrong ID" })
        })
})

app.get('/viewer/:id', async (req, res) => {
    console.log(req.params.id)
    const email = await Email.findById(req.params.id)

    .then(response => {
        console.log(response)
        console.log("Success")
        const {sender, message, images } = response;
            res.render(`document`, { sender, message, images, err: '' })
        }
    ).catch(err => {
        console.log(err)
        res.render('document', { sender: '', message: '', images: [], err: "Wrong ID" })
    })
})


const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
}, app)

sslServer.listen(port, () => {
    console.log(`Application is running on ${port}`)
})