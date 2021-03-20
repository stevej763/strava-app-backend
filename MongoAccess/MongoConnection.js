require('dotenv').config();
const { MongoClient } = require('mongodb');

class Mongo {
    constructor() {
        this.client = new MongoClient(process.env.DB_HOST, { useUnifiedTopology: true });
    }

    async connectToDatabase() {
        await this.client.connect();
        console.log('Connected to MongoDB...');
        this.db = this.client.db(process.env.DB_NAME);
    }

    async saveSession(sessionId, athleteId) {
        console.log('saving session ID')
        console.log(athleteId)
        let savedSession = await this.db.collection("sessions").insertOne({ '_id': sessionId, 'athlete_id': athleteId})
        console.log('saved session ID')
        return savedSession.ops[0];
    }

    async getSession(sessionId) {
        console.log("loading session")
        const exisitngSession = await this.db.collection("sessions").findOne({'_id': sessionId})
        console.log("loaded session")
        return exisitngSession.ops[0];
    }

    async saveUser(athleteData) {
        console.log('saving athlete data')
        let savedAthleteData = await this.db.collection("users").insertOne(athleteData)
        console.log('saved athlete data')
        return savedAthleteData.ops[0];
    }

    async getUser(athleteId) {
        console.log('loading athlete data')
        const athleteData = await this.db.collection("athleteData").findOne({ 'athlete.id': parseInt(athleteId)})
        console.log(athleteData)
        console.log('loaded athlete data')
        return athleteData.ops[0];
    }
}

module.exports = new Mongo();