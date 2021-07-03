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
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db.collection('tweets')
        .add(newTweet)
        .then(doc => {
            const resTweet = newTweet;
            resTweet.tweetId = doc.id;
            res.json({resTweet});
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
        .then((data) => {
            tweetData.comments = [];
            data.forEach((doc) => {
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
            return doc.ref.update({commentCount: doc.data().commentCount + 1});
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: 'Something went wrong'})
        })
}

exports.likeTweet = (req, res) => {
    const likeDocument = db
      .collection('likes')
      .where('userHandle', '==', req.user.handle)
      .where('tweetId', '==', req.params.tweetId)
      .limit(1);
  
    const tweetDocument = db.doc(`/tweets/${req.params.tweetId}`);
  
    let tweetData;
  
    tweetDocument
      .get()
      .then((doc) => {
        if (doc.exists) {
          tweetData = doc.data();
          tweetData.tweetId = doc.id;
          return likeDocument.get();
        } else {
          return res.status(404).json({ error: 'Tweet not found' });
        }
      })
      .then((data) => {
        if (data.empty) {
          return db
            .collection('likes')
            .add({
              tweetId: req.params.tweetId,
              userHandle: req.user.handle
            })
            .then(() => {
              tweetData.likeCount++;
              return tweetDocument.update({ likeCount: tweetData.likeCount });
            })
            .then(() => {
              return res.json(tweetData);
            });
        } else {
          return res.status(400).json({ error: 'Tweet already liked' });
        }
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
};

exports.unlikeTweet = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('tweetId', '==', req.params.tweetId)
        .limit(1);

    const tweetDocument = db.doc(`/tweets/${req.params.tweetId}`);

    let tweetData;

    tweetDocument
        .get()
        .then((doc) => {
        if (doc.exists) {
            tweetData = doc.data();
            tweetData.tweetId = doc.id;
            return likeDocument.get();
        } else {
            return res.status(404).json({ error: 'Tweet not found' });
        }
        })
        .then((data) => {
        if (data.empty) {
            return res.status(400).json({ error: 'Tweet not liked' });
        } else {
            return db
            .doc(`/likes/${data.docs[0].id}`)
            .delete()
            .then(() => {
                tweetData.likeCount--;
                return tweetDocument.update({ likeCount: tweetData.likeCount });
            })
            .then(() => {
                res.json(tweetData);
            });
        }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};

exports.deleteTweet = (req, res) => {
    const document = db.doc(`/tweets/${req.params.tweetId}`);
    document.get()
        .then(doc => {
            if(!doc.exists){
                return res.status(400).json({error: 'Tweet does not exist'})
            }
            if(doc.data().userHandle !== req.user.handle){
                return res.status(403).json({error: 'Unauthorized'})
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({message: "Tweet has been deleted"});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })
}