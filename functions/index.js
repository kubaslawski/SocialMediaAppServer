const functions = require("firebase-functions");

const app = require('express')(); 
const FbAuth = require('./util/FbAuth');

const {getAllTweets, postTweet} = require('./handlers/tweets');
const {signUp, login} = require('./handlers/users');


//Tweets routes
app.get('/tweets', getAllTweets);
app.post('/tweet', FbAuth, postTweet);
//User routes
app.post('/signup', signUp);
app.post('/login', login)

exports.api = functions.region('europe-west1').https.onRequest(app);