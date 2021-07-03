const {db} = require('../util/admin');

exports.getAllTweets = (req, res) => {
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
}

exports.postTweet = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty' });
    }
    
    const newTweet = {
        body: req.body.body, 
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };

    db.collection('tweets')
        .add(newTweet)
        .then(doc => {
            res.json({ message: `document ${doc.id} has been created successfully` });
        })
        .catch(err => {
            res.status(500).json({error: 'Something went wrong'});
            console.error(err);
        });
}

exports.getTweet = (req, res) => {
    let tweetData = {};
    db.doc(`/tweets/${req.params.tweetId}`).get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({error: "Tweet doesn't exist"})
            }
            tweetData = doc.data();
            tweetData.tweetId = doc.id;
            return db
                .collection('comments')
                .orderBy("createdAt", "desc")
                .where('tweetId', '==', req.params.tweetId)
                .get();
        })
        .then(data => {
            tweetData.comments = [];
            data.forEach(doc => {
                tweetData.comments.push(doc.data());
            });
            return res.json(tweetData)
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: err.code})
        })
}

exports.commentTweet = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({error: 'Must not be empty'})

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        tweetId: req.params.tweetId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/tweets/${req.params.tweetId}`).get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({error: 'Tweet not found'})
            }
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            res.json(newComment);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: 'Something went wrong'})
        })
}