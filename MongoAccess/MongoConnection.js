require('dotenv').config();
const {
    MongoClient
} = require('mongodb');

class Mongo {
    constructor() {
        this.client = new MongoClient(process.env.DB_HOST, {
            useUnifiedTopology: true
        });
    }

    async connectToDatabase() {
        await this.client.connect();
        console.log('Connected to MongoDB...');
        this.db = this.client.db(process.env.DB_NAME);
    }

    async saveSession(sessionId, athleteId) {
        console.log('saving new session ID')
        let savedSession = await this.db.collection("sessions").insertOne({
            '_id': sessionId,
            'athlete_id': athleteId,
            'created_at': new Date()
        })
        console.log('saved new session ID')
        return savedSession.ops[0];
    }

    async getSession(sessionId) {
        console.log("loading existing session")
        let exisitngSession = await this.db.collection("sessions").findOne({
            '_id': sessionId
        })
        console.log(exisitngSession)
        console.log("loaded existing session")
        return exisitngSession;
    }

    async getAthleteIdForSession(sessionId) {
        console.log('retrieving athlete ID for', sessionId)
        let session = await this.db.collection("sessions").findOne({
            '_id': sessionId
        })
        console.log('athlete id for session', session.athlete_id)
        return session.athlete_id
    }

    async saveAthleteData(athleteData) {
        console.log('saving new athlete data')
        let savedAthleteData = await this.db.collection("athleteData").insertOne(athleteData)
        console.log('saved new athlete data')
        return savedAthleteData.ops[0];
    }

    async getAthleteData(athleteId) {
        console.log('loading existing athlete data')
        const athleteData = await this.db.collection("athleteData").findOne({
            'athlete.id': parseInt(athleteId)
        })
        if (athleteData == null) {
            console.log('no existing athlete data found')
        } else {
            console.log('found existing athlete data')
        }
        
        return athleteData;
    }

    async getAthleteAccessToken(athleteId) {
        console.log('retrieving athlete access token')
        const athleteData = await this.db.collection("athleteData").findOne({
            'athlete.id': parseInt(athleteId)
        })
        if (athleteData == null) {
            console.log('no existing athlete data found')
        } else {
            console.log('found existing athlete access token')
        }
        
        return athleteData.access_token; 
    }

    async updateAthleteAccessCodeData(newAccessTokenDetails, athleteId) {
        console.log('updating expired access code)')
        const updatedAthleteData = await this.db.collection("athleteData").updateOne({
            'athlete.id': parseInt(athleteId)
        }, {
            $set: {
                "expires_at": newAccessTokenDetails.expires_at,
                "expires_in": newAccessTokenDetails.expires_in,
                "refresh_token": newAccessTokenDetails.refresh_token,
                "access_token": newAccessTokenDetails.access_token
            }
        })
        console.log('Updated access code')
        return updatedAthleteData
    }

    async updateAthleteData(athleteData, athleteId) {
        console.log('updating athlete data (all)')
        const updatedAthleteData = await this.db.collection("athleteData").updateOne({
            'athlete.id': parseInt(athleteId)
        }, {
            $set: {
                athleteData
            }
        })
        console.log('Updated athlete data')
        return updatedAthleteData
    }

}

module.exports = new Mongo();