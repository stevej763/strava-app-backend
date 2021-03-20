require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const {
    v4: uuid
} = require('uuid');
const mongo = require('../MongoAccess/MongoConnection');

const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.WEBSERVER}:${process.env.PORT}/api/authentication/strava-auth-response&approval_prompt=force&scope=read_all,activity:read_all,profile:read_all`


router.get('/login/:sessionId', async (req, res) => {
    let recievedSessionId = req.params.sessionId
    let athleteId = await loadUserSession(recievedSessionId);
    let userData = await loadUserData(athleteId);
    if (userData == 'redirect to strava') {
        res.redirect(stravaAuthUrl)
    } else {
        res.send(userData)
    }
})

router.get('/login', (req, res) => {
    res.redirect(stravaAuthUrl)
})

router.get('/strava-auth-response', async (req, res) => {

    scope = req.query.scope
    authCode = req.query.code
    if (recievedExpectedScope(scope)) {
        let athleteData = await exchangeAuthTokenForAccess(authCode)
        let savedSessionId = await saveUserSession(athleteData);
        let savedAthleteData = await saveUserData(athleteData)
        res.send([
            {savedSessionId},
            {savedUserData: savedAthleteData}
        ])

    } else {
        res.send( "Scope for app was not given")
    }
})

const recievedExpectedScope = (scope) => {
    result = false
    if (scope == 'read,activity:read_all,profile:read_all,read_all') {
        result = true;
    }
    return result;
}

const exchangeAuthTokenForAccess = async (authCode) => {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.strava.com/oauth/token',
            params: {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code: authCode,
                grant_type: 'authorization_code'
            }
        });
        return response.data;
    } catch (error) {
        return error;
    };
}


const saveUserSession = async (stravaUserData) => {
    if (stravaUserData.access_token !== null) {
        let sessionId = uuid();
        console.log(stravaUserData)
        let savedSession = await mongo.saveSession(sessionId, stravaUserData.athlete.id);
        console.log(sessionId)
        return savedSession
    } else {
        throw error;
    }

}

const loadUserSession = async (sessionId) => {
    let session = await mongo.getSession(sessionId)
    if (session !== null) {
        return session.athlete_id;
    } else {
        return process.env.NO_SESSION_ERROR;
    }
}

const saveUserData = async (athleteData) => {
    if (athleteData.access_token !== null) {
        let savedAthleteData = await mongo.saveUser(athleteData)
        return savedAthleteData;
    } else {
        return "error"
    }
    
}

const loadUserData = async (athleteId) => {
    if (athleteId == process.env.NO_SESSION_ERROR) {
        return 'redirect to strava'
    } else {
        let userData = await mongo.getUser(athleteId)
        return userData
    }
}

module.exports = router