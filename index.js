require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const mongo = require('./MongoAccess/MongoConnection');
const authentication = require('./routes/authentication')

startMongo = async () => await mongo.connectToDatabase();
startMongo();


app.use('/api/authentication', authentication)
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the Strava Dashboard API!')
})

app.get('/endpoints', (req, res) => {
    res.status(200).send([
        {'login':'localhost:4000/api/authentication/login'},
        {'exisiting session login':'localhost:4000/api/authentication/login/:id'},
        {'strava-auth-response':'localhost:4000/api/strava-auth-response'},
        ])
})

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
})