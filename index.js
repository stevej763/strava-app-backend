require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


const mongo = require('./MongoAccess/MongoConnection');
const authentication = require('./routes/authentication')
const athleteData = require('./routes/athleteData')

startMongo = async () => await mongo.connectToDatabase();
startMongo();


app.use('/api/authentication', authentication)
app.use('/api/athlete', athleteData)
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the Strava Dashboard API!')
})

app.get('/endpoints', (req, res) => {
    res.status(200).send([
        {'login':'localhost:4000/api/authentication/login'},
        {'exisiting session login':'localhost:4000/api/authentication/login/:id'},
        {'strava-auth-response':'localhost:4000/api/strava-auth-response'},
        {'athlete stats':'localhost:4000/api/athlete/stats/:id'}
        ])
})

app.get('*', (req, res) => {
    res.status(404).send('what???');
  });

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
})