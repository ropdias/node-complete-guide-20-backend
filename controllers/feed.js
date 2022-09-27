const { validationResult } = require("express-validator");
const { unlink } = require("fs/promises");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res
        .status(200)
        .json({ message: "Fetched posts successfully.", posts: posts });
    })
    .catch((err) => {
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  const image = req.file; // Here you get an object from multer with information from the file uploaded (or undefined if rejected)
  if (!image) {
    const error = new Error("No image provided.");
    error.statusCode = 422; // Unprocessable Entity (Validation error)
    throw error;
  }
  if (!errors.isEmpty()) {
    return unlink(image.path) // Deleting the image if the validation fails
      .then(() => {
        const error = new Error(
          "Validation failed, entered data is incorrect."
        );
        error.statusCode = 422; // Unprocessable Entity (Validation error)
        throw error; // catch() will catch this and forward with next()
      })
      .catch((err) => {
        next(err);
      });
  }
  const imageUrl = image.path.replace("\\", "/"); // Getting the image path to store in the DB and fetch the image later
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
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const image = req.file;
  const updatedTitle = req.body.title;
  const updatedContent = req.body.content;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect.");
    error.statusCode = 422; // Unprocessable Entity (Validation error)
    if (image) {
      return unlink(image.path)
        .then(() => {
          throw error;
        })
        .catch((err) => {
          next(err);
        });
    } else {
      throw error;
    }
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404; // Not Found error
        throw error; // catch() will catch this and forward with next()
      }
      post.title = updatedTitle;
      post.content = updatedContent;
      if (image) {
        return unlink(post.imageUrl).then(() => {
          post.imageUrl = image.path.replace("\\", "/"); // Getting the image path to store in the DB and fetch the image later;
          return post.save();
        });
      } else {
        return post.save();
      }
    })
    .then((result) => {
      res.status(200).json({ message: "Post updated!", post: result });
    })
    .catch((err) => {
      next(err);
    });
};
