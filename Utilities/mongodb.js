var env = process.env.NODE_ENV || 'development';
var config = require("../Utilities/config")[env];
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var dbo;
const urlmera='mongodb+srv://Hafizjunaid:ansari12345@cluster0.rj1aicj.mongodb.net/Vechile?retryWrites=true&w=majority';
const connectDB = async callback => {
    try {
        mongoClient.connect(urlmera, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
            if (err) return console.error(err);
            dbo = db.db(config.database.db);
            return callback(err);
        });
    } catch (e) {
        throw e;
    }
};




const getDB = () => { return dbo; };

const disconnectDB = () => { dbo = null };

module.exports = { connectDB, getDB, disconnectDB };