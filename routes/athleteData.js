require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongo = require('../MongoAccess/MongoConnection');

router.get('/stats/:sessionId', async (req, res) => {
    let sessionId = req.params.sessionId;
    let athleteStats = await getAthleteStats(sessionId);

    res.status(200).send(athleteStats);
})

router.get('/activities/:sessionId', async (req, res) => {
    let sessionId = req.params.sessionId;
    let activities = await getAthleteActivities(sessionId)
    res.status(200).send(activities)
})

const getAthleteStats = async (sessionId) => {
    let athleteId = await mongo.getAthleteIdForSession(sessionId);
    let access_token = await mongo.getAthleteAccessToken(athleteId)
    try {
        let response = await axios({
            method: 'get',
            url: `https://www.strava.com/api/v3/athletes/${athleteId}/stats`,
            params: {
                'access_token': access_token
            }
        })
        return response.data;
    } catch (error) {
        console.log(error)
        return error.response.status;
    }
}

const getAthleteActivities = async (sessionId) => {
    let athleteId = await mongo.getAthleteIdForSession(sessionId);
    let access_token = await mongo.getAthleteAccessToken(athleteId);
    try {
        let response = await axios({
            method: 'get',
            url: `https://www.strava.com/api/v3/athlete/activities`,
            params: {
                'access_token': access_token
            }
        })
        return response.data;
    } catch (error) {
        console.log(error)
        return error.response.status;
    }
}


module.exports = router