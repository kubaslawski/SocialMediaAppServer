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

exports.postTweet = (req, res)=> {
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