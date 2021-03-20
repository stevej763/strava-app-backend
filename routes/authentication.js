require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const uuid = require('uuid').v4;
const mongo = require('../MongoAccess/MongoConnection');

const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.WEBSERVER}:${process.env.PORT}/api/authentication/strava-auth-response&approval_prompt=force&scope=read_all,activity:read_all,profile:read_all`


router.get('/login/:sessionId', async (req, res) => {
    let recievedSessionId = req.params.sessionId
    let athleteId = await loadUserSession(recievedSessionId);
    let athleteData = await loadUserData(athleteId);
    await checkAccessToken(athleteData)
    if (athleteData == process.env.NO_SESSION_ERROR) {
        res.redirect(stravaAuthUrl)
    } else {
        res.send(athleteData)
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
        let savedAthleteData = await saveAthleteData(athleteData)
        res.send([{
                savedSessionId
            },
            {
                savedAthleteData: savedAthleteData
            }
        ])

    } else {
        res.send("Scope for app was not given")
    }
})

const recievedExpectedScope = (scope) => {
    result = false
    if (scope == 'read,activity:read_all,profile:read_all,read_all') {
        result = true;
    }
    return result;
}

const checkAccessToken = async (athleteData) => {
    if (athleteData !== process.env.NO_SESSION_ERROR) {
        let expiryTime = new Date(athleteData.expires_at * 1000);
        let refreshToken = athleteData.refresh_token
        let athleteId = athleteData.athlete.id
        if (expiryTime < Date.now()) {
            let newAccessTokenDetails = await refreshExpiredAccessToken(refreshToken)
            let updatedAthleteAccessToken = await updateAccessToken(newAccessTokenDetails, athleteId)
            console.log(updatedAthleteAccessToken)
        } else {
            console.log(expiryTime)
        }
    }

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
        console.log('Error exchanging auth token', error.response.statusText)
        return error.response.status;
    };
}

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
}

const updateAccessToken = async (newAccessToken, athleteData) => {
    let updatedAccessToken = await mongo.updateAthleteData(newAccessToken, athleteData)
    return updatedAccessToken
}


const saveUserSession = async (stravaUserData) => {
    if (stravaUserData.access_token !== null && stravaUserData !== 400) {
        let sessionId = uuid();
        console.log(stravaUserData)
        let savedSession = await mongo.saveSession(sessionId, stravaUserData.athlete.id);
        console.log(sessionId)
        return savedSession
    } else {
        console.log('error saving user session')
        return 'error saving user session'
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

const saveAthleteData = async (athleteData) => {
    if (athleteData.access_token !== null && athleteData !== 400) {
        let savedAthleteData = await mongo.saveAthleteData(athleteData);
        return savedAthleteData;
    } else {
        console.log('error saving user data');
        return "error saving user data";
    }

}

const loadUserData = async (athleteId) => {
    if (athleteId == process.env.NO_SESSION_ERROR) {
        return process.env.NO_SESSION_ERROR;
    } else {
        let userData = await mongo.getAthleteData(athleteId);

        return userData;
    }
}

module.exports = router