require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const authentication = require('./routes/authentication')
app.use('/api/authentication', authentication)

app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the Strava Dashboard API!')
})

app.get('/endpoints', (req, res) => {
    res.status(200).send([
        {'login':'localhost:4000/api/authentication/login'},
        {'strava-auth-response':'localhost:4000/api/strava-auth-response'}
        ])
})

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
})