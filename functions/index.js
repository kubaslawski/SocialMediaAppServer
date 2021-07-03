const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require('express')(); //equals to 
// const express = require('express');
// const app = express();

admin.initializeApp();

var config = {
    apiKey: "AIzaSyBCUr-QCvOlMcYGcUpQx1whN2nT-YXLdvw",
    authDomain: "socialmediaapp-e541d.firebaseapp.com",
    projectId: "socialmediaapp-e541d",
    storageBucket: "socialmediaapp-e541d.appspot.com",
    messagingSenderId: "105280583544",
    appId: "1:105280583544:web:c0bcac4b218dd303aa7a8d",
    measurementId: "G-VD4L06RC4R"
  };



const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();

//Get all tweets
app.get('/tweets', (req, res) => {
    db
    .collection("tweets")
    .orderBy("createdAt", "desc") 
    .get()
    .then((data) => {
        const tweets = [];
        data.forEach((doc) => {
            tweets.push({
                tweetId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount
            });
        });
        return res.json(tweets);
    })
    .catch((err) => console.error(err));
})

//Post a tweet
app.post('/tweet', (req, res)=> {
    const newTweet = {
        body: req.body.body, 
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db
    .collection('tweets')
    .add(newTweet)
    .then(doc => {
        res.json({ message: `document ${doc.id} has been created successfully` });
    })
    .catch(err => {
        res.status(500).json({error: 'Something went wrong'});
        console.error(err);
    });
})

//Sign up 
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    //Validation to be done 
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
    .then((doc) => {
        if(doc.exists){
            return res.status(400).json({handle: 'this handle is already taken'})
        } else {
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then((data) => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idToken) => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle, 
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
        return res.status(201).json({token}); 
    })
    .catch(err => {
        console.log(err);
        if(err.code === "auth/email-already-in-use"){
            return res.status(400).json({email: "Email already used"})
        } else {
            return res.status(500).json({message: err.code})
        }
        
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);