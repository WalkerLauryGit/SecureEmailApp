const express = require('express')
// const { auth, requiresAuth } = require('express-openid-connect')
const sgMail = require('@sendgrid/mail')
const session = require('express-session')
const path = require('path')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
require('dotenv').config()
// const config = {
//     authRequired: false,
//     auth0Logout: true,
//     secret: 'cb889f2f1e59a9125bf30dd7159014667b6cc2bdc23da0d4fa14868c80084f96',
//     baseURL: 'http://localhost:3000',
//     clientID: 'O6wSLf7xpUfr5tppjuzVNNPiIh7fJJSJ',
//     issuerBaseURL: 'https://wlaury.auth0.com'
// }

// DATABASE MONGOOSE CONNECTION
mongoose.connect('mongodb://127.0.0.1:27017/securesend', {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    console.log("The database bird has landed")
})
.catch(err =>{
    console.log(err)
})

const emailSchema = new mongoose.Schema({
    sender: String,
    recipient: String,
    password: String,
    message: String,

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
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(session({
    secret: 'this is the secret', 
    resave: false, 
    saveUninitialized: true, 
    cookie: {secure: true}
}))


app.get('/profile', (req, res) =>{
   
  res.render("profile/index", {user: users[0], emails})  
})

app.get('/', (req, res) => {
    
    res.render('index')
})

app.get('/document', (req, res)=>{
    res.render('document')
})

app.post('/',  (req, res) => {
    const {sender, recipient, password, message} = req.body
    // Left off adding an id to the email value before saving it to the database
    const email = new Email({ sender, recipient, password, message})
    email.save()
    .then((e) =>{
        console.log(e, "successfully saved")
    })
    .catch(err => console.log(err));
    

    const from = 'donotreply@sendingsecurely.com'
    const msg = {
        to: recipient,
        from,
        subject: `You have a message waiting from ${sender}`,
        text: message,
        html: `<div>Click the button to be taken to the secure messsage!<br> <a href="http://localhost:3000/viewer/${email._id}>Click here</a></div>"`
    }

    sgMail.send(msg)
    .then(() => console.log('Email sent successfuly'))
    .catch(err => console.log(err.message))

    res.redirect('/')
})

app.get('/viewer/:id', async (req, res) => {
    email = await  Email.findById(req.params.id)
    if(password === email.password){
    res.render('/document', {email})
    } else{
        res.render('/document', {error: 'The email could not be found'})
    }
})


app.listen(3000, ()=>{
    console.log("Application is listening on port 3000")
})