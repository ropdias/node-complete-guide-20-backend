const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First Post",
        content: "This is the first post!",
        imageUrl: "images/book2.png",
        creator: {
          name: "Rodrigo",
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  // We don't need to add createdAt, mongoose will add automatically because of "timestamp: true"
  const post = new Post({
    title: title,
    content: content,
    imageUrl: 'images/book2.png',
    creator: { name: "Rodrigo" },
  });
  post
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      // Just to check if we added a statusCode already
      if (!err.statusCode) {
        err.statusCode = 500; // Its some server side error.
      }
      next(err);
    });
};
