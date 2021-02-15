const express = require('express')
const { auth, requiresAuth } = require('express-openid-connect')

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: 'cb889f2f1e59a9125bf30dd7159014667b6cc2bdc23da0d4fa14868c80084f96',
    baseURL: 'http://localhost:3000',
    clientID: 'O6wSLf7xpUfr5tppjuzVNNPiIh7fJJSJ',
    issuerBaseURL: 'https://wlaury.auth0.com'
}


const app = express();

app.use(auth(config))

// home route
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
})

app.get('/profile', requiresAuth(), (req, res) =>{
    res.send(JSON.stringify(req.oidc.user))
})

// signup/logout route


app.listen(3000, ()=>{
    console.log("Application is listening on port 3000")
})