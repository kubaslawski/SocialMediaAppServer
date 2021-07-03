const functions = require("firebase-functions");

const app = require('express')(); 
const FbAuth = require('./util/FbAuth');

const {
    getAllTweets, 
    postTweet, 
    getTweet,
    commentTweet, 
    likeTweet,
    unlikeTweet,
    deleteTweet
} = require('./handlers/tweets');
const {
    signUp,
    login,
    uploadImage,
    addUserDetails, 
    getAuthenticatedUser
} = require('./handlers/users');
//Tweets routes
app.get('/tweets', getAllTweets);
app.post('/tweet', FbAuth, postTweet);
app.get(`/tweet/:tweetId`, getTweet);
app.delete('/tweet/:tweetId/delete', FbAuth, deleteTweet);
app.get('/tweet/:tweetId/like', FbAuth, likeTweet);
app.get('/tweet/:tweetId/unlike', FbAuth, unlikeTweet);
app.post('/tweet/:tweetId/comment', FbAuth, commentTweet);

//User routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FbAuth, uploadImage);
app.post('/user', FbAuth, addUserDetails);
app.get('/user', FbAuth, getAuthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);