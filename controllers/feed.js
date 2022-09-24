const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res
        .status(200)
        .json({ message: "Fetched posts successfully.", posts: posts });
    })
    .catch((err) => {
      // Just to check if we added a statusCode already
      if (!err.statusCode) {
        err.statusCode = 500; // Server Side error.
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  const image = req.file; // Here you get an object from multer with information from the file uploaded (or undefined if rejected)
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422; // Unprocessable Entity (Validation error)
    throw error;
  }
  if (!image) {
    const error = new Error("No image provided.");
    error.statusCode = 422; // Unprocessable Entity (Validation error)
    throw error;
  }
  const imageUrl = image.path.replace("\\" ,"/"); // Getting the image path to store in the DB and fetch the image later
  console.log(imageUrl);
  const title = req.body.title;
  const content = req.body.content;
  // We don't need to add createdAt, mongoose will add automatically because of "timestamp: true"
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
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
        err.statusCode = 500; // Server Side error.
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404; // Not Found error
        throw error; // catch() will catch this and forward with next()
      }
      res.status(200).json({ message: "Post fetched.", post: post });
    })
    .catch((err) => {
      // Just to check if we added a statusCode already
      if (!err.statusCode) {
        err.statusCode = 500; // Server Side error.
      }
      next(err);
    });
};
