require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuid } = require('uuid');

const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.WEBSERVER}:${process.env.PORT}/api/authentication/strava-auth-response&approval_prompt=force&scope=read_all,activity:read_all,profile:read_all`


router.get('/login', (req, res) => {
    res.redirect(stravaAuthUrl)
})

router.get('/strava-auth-response', async (req, res) => {
    scope = req.query.scope
    authCode = req.query.code
    let response;
    if (recievedExpectedScope(scope)) {
        accessToken = await exchangeAuthTokenForAccess(authCode)
        if (accessToken !== null) {
            response = uuid()
        }
    } else {
        response = "Scope for app was not given"
    }
    res.send(response)
})


const recievedExpectedScope = (scope) => {
    result = false
    if (scope == 'read,activity:read_all,profile:read_all,read_all') {
        result = true;
    }
    return result
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
        console.log(response.data)
        return response.data.access_token
    } catch (error) {
        return error
    }

}

module.exports = router