require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const uuid = require('uuid').v4;
const uuidValidate = require('uuid').validate;
const mongo = require('../MongoAccess/MongoConnection');

const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&approval_prompt=force&scope=read_all,activity:read_all,profile:read_all`

router.get('/login/:sessionId', async (req, res) => {
    let recievedSessionId = req.params.sessionId
    let athleteId = await loadUserSession(recievedSessionId);
    let athleteData = await loadAthleteData(athleteId);
    let expired = await checkAccessToken(athleteData)
    if(expired) {
        athleteData = await loadAthleteData(athleteId);
    }
    if (athleteData == process.env.NO_SESSION_ERROR) {
        res.send('no valid UUID')
    } else if (athleteData == process.env.NEW_USER) {
        console.log('sending strava auth url')
        console.log(`${stravaAuthUrl}&redirect_uri=${process.env.WEBSERVER}:${process.env.PORT}/api/authentication/strava-auth-response/${recievedSessionId}`)
        res.status(200).send(`${stravaAuthUrl}&redirect_uri=${process.env.WEBSERVER}/api/authentication/strava-auth-response/${recievedSessionId}`)
    } else {
        res.status(200).send(
            {'user': {
                'existing_user': true,
                'athlete': athleteData.athlete
            }}
            )
    }
});

router.get('/strava-auth-response/:sessionId', async (req, res) => {
    let recievedSessionId = req.params.sessionId
    let scope = req.query.scope
    let authCode = req.query.code
    console.log(req)
    if (recievedExpectedScope(scope)) {
        let athleteData = await exchangeAuthTokenForAccessToken(authCode)
        await saveUserSession(athleteData, recievedSessionId);
        await saveAthleteData(athleteData)
        res.redirect(`http://localhost:${process.env.REACT_PORT}`)
    } else {
        res.send("Scope for app was not given")
    };
});

router.get('*', (req, res) => {
    res.status(404).send('page does not exist');
  });

const recievedExpectedScope = (scope) => {
    result = false
    if (scope == 'read,activity:read_all,profile:read_all,read_all') {
        result = true;
    }
    return result;
};

const checkAccessToken = async (athleteData) => {
    if (athleteData !== process.env.NO_SESSION_ERROR && athleteData !== process.env.NEW_USER) {
        let expiryTime = new Date(athleteData.expires_at * 1000);
        let refreshToken = athleteData.refresh_token
        let athleteId = athleteData.athlete.id
        if (expiryTime < Date.now()) {
            let newAccessTokenDetails = await refreshExpiredAccessToken(refreshToken)
            let updatedAthleteAccessToken = await updateAccessToken(newAccessTokenDetails, athleteId)
            console.log(updatedAthleteAccessToken)
            return true
        } else {
            console.log("access expiry time:", expiryTime)
            return false
        }
    } else {
        return false
    }
};

const exchangeAuthTokenForAccessToken = async (authCode) => {
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
        console.log('Error exchanging auth token', error.response.statusText)
        return error.response.status;
    };
};

const refreshExpiredAccessToken = async (refreshToken) => {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.strava.com/oauth/token',
            params: {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }
        });
        return response.data;
    } catch (error) {
        console.log('Error retrieving refresh token', error)
        return error.response.status;
    };
};

const updateAccessToken = async (newAccessToken, athleteData) => {
    let updatedAccessToken = await mongo.updateAthleteAccessCodeData(newAccessToken, athleteData)
    return updatedAccessToken;
};

const saveUserSession = async (stravaUserData, sessionId) => {
    if (stravaUserData.access_token !== null && stravaUserData !== 400) {
        let savedSession = await mongo.saveSession(sessionId, stravaUserData.athlete.id);
        console.log(sessionId)
        return savedSession;
    } else {
        console.log('error saving user session')
        return 'error saving user session'
    };
};

const loadUserSession = async (sessionId) => {
    let session = await mongo.getSession(sessionId)
    if (session !== null) {
        return session.athlete_id;
    } else if (uuidValidate(sessionId)) {
        console.log("this is a new user")
        return process.env.NEW_USER
    } else {
        console.log('not a valid UUID')
        return process.env.NO_SESSION_ERROR;
    };
};

const saveAthleteData = async (athleteData) => {
    if (athleteData.access_token !== null && athleteData !== 400) {
        let updatedAthleteData = await existingUser(athleteData) ? await mongo.updateAthleteData(athleteData) : mongo.saveAthleteData(athleteData);
        return updatedAthleteData;
    } else {
        console.log('error saving user data');
        return "error saving user data";
    };
};

const existingUser = async (athleteData) => {
    let existingData = await loadAthleteData(athleteData.athlete.id)
    if(existingData == null) {
        return false;
    } else {
        return true;
    };
};

const loadAthleteData = async (athleteId) => {
    if (athleteId == process.env.NO_SESSION_ERROR) {
        return athleteId;
    } else if (athleteId == process.env.NEW_USER) {
        return athleteId;
    } else {
        let userData = await mongo.getAthleteData(athleteId);
        return userData;
    };
};


module.exports = router