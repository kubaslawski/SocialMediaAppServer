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

const isEmpty = (string) => {
    if(string.trim() === '') {
        return true;
    } else {
        return false;
    }
} 

const isEmail = (email) => {
    const regEx =  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) {
        return true;
    } else {
        return false;
    }
}

//Sign up 
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    let errors = {};

    if(isEmpty(newUser.email)) {
        errors.email = "Must not be empty";
    } else if(!isEmail(newUser.email)) {
        errors.email = "Must be a valid email address";
    }

    if(isEmpty(newUser.password)){
        errors.passowrd = "Must not be empty";
    }

    if(newUser.password !== newUser.confirmPassword) {
        errors.confirmPassword = "Password must match";
    }

    if(isEmpty(newUser.handle)){
        errors.handle = "Must not be empty"
    }

    if(Object.keys(errors).length > 0){
        return res.status(400).json(errors);
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

//login
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email, 
        password: req.body.password
    };

    let errors = {};
    if(isEmpty(user.email)) {
        errors.email = "Must not be empty"
    }
    if(isEmpty(user.password)) {
        errors.password = "Must not be empty"
    }

    if(Object.keys(errors).length > 0) {
        return res.status(400).json(errors)
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({token});
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/wrong-password'){
                return res.status(403).json({general: 'Wrong credentials, please try again'})
            } else {
                return res.status(500).json({error: err.code})
            }
        })
})

exports.api = functions.region('europe-west1').https.onRequest(app);