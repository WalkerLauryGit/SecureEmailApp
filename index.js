const express = require('express')
// const { auth, requiresAuth } = require('express-openid-connect')
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

require('dotenv').config()


// DATABASE MONGOOSE CONNECTION
// Old Connection String mongodb://127.0.0.1:27017/securesend
mongoose.connect('mongodb+srv://dmad:Copper14@securesend.bwzso.mongodb.net/securesend?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
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

const users = [
    {
        name: 'Walker',
        email: 'walkerclaury@protonmail.com',
    }
]

const emails = [
    {
        id: 0,
        sender: "walkerclaury@protonmail.com",
        recipient: "jmichaels@feer.com",
        topic: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure cupiditate maxime saepe ipsum dolores ad facilis rerum magni architecto aspernatur iusto et incidunt sed asperiores dolorem perferendis molestiae, odit quam?",
        date: "2/15/21"
    },
    {
        id: 1,
        sender: "walkerclaury@protonmail.com",
        recipient: "barnicles@fefer.com",
        topic: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure cupiditate maxime saepe ipsum dolores ad facilis rerum magni architecto aspernatur iusto et incidunt sed asperiores dolorem perferendis molestiae, odit quam?",
        date: "2/1/21"
    },
    {
        id: 3,
        sender: "walkerclaury@protonmail.com",
        recipient: "ungasmoothbrain@feer.com",
        topic: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure cupiditate maxime saepe ipsum dolores ad facilis rerum magni architecto aspernatur iusto et incidunt sed asperiores dolorem perferendis molestiae, odit quam?",
        date: "2/4/21",
    }
]

const SG_API = process.env.SG_API;

const app = express();
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

// Page where you see what is retrieved from /document
app.get('/profile', (req, res) => {

    res.render("profile/index", { user: users[0], emails })
})

// Home page where you can create a request
app.get('/', (req, res) => {

    res.render('index')
})

// Page where you can retrieve a document from
app.get('/document', (req, res) => {
    res.render('document', { sender: '', message: '', images: [], err: '' })
})

// Uploads images and message to cloudinary
app.post('/', upload.array('image'), (req, res) => {


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
                <br> <a style="height: 10px; width: 10px" href="http://localhost:3000/viewer/${email._id}>
                Click here</a></div>"
                <div>
                <p>The id of the message is ${email._id}</p>
                <p>The password is ${email.password}</p>
                </div>`
    }

    sgMail.send(msg)
        .then(() => console.log('Email sent successfuly'))
        .catch(err => console.log(err.message))

    res.redirect('/')
})

// This is what retrieves the actual message and returns the successful or returns nothing
app.post('/viewer', async (req, res) => {
    console.log(req.body)
    email = await Email.findById(req.body.id)

        .then(response => {
            console.log(response)
            console.log("Success")
            const { sender, message, images, password } = response;
            if (password === req.body.password) {
                res.render(`document`, { sender, message, images, err: '' })
            } else {
                res.render(`document`, { sender, message: '', images: [], err: 'Incorrect password' })
            }
        }).catch(err => {
            console.log(err)
            res.render('document', { sender: '', message: '', images: [], err: "Something happened" })
        })
})


app.listen(3000, () => {
    const link = terminalLink('Port 3000!!!', 'http://localhost:3000')
    console.log(`Application is running on ${link}`)
})