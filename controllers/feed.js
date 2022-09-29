const { validationResult } = require("express-validator");
const { unlink } = require("fs/promises");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
  const currentPage = +req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((numPosts) => {
      totalItems = numPosts;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .populate({ path: "creator", select: "name" }); // Using populate to get the name of the creator
    })
    .then((posts) => {
      res.status(200).json({
        message: "Fetched posts successfully.",
        posts: posts,
        totalItems: totalItems,
      });
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
  let creator;
  // We don't need to add createdAt, mongoose will add automatically because of "timestamp: true"
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId, // This will be a string not an object but mongoose will convert it for us
  });
  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this id could not be found.");
        error.statusCode = 422; // Unprocessable Entity (Validation error)
        throw error; // catch() will catch this and forward with next()
      }
      creator = user;
      user.posts.push(post); // Here mongoose will do all the heavy lifting of pulling out the post ID and adding that to the user actually
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        // 201 Created
        message: "Post created successfully!",
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate({ path: "creator", select: "name" }) // Using populate to get the name of the creator
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

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404; // Not Found error
        throw error; // catch() will catch this and forward with next()
      }
      // Check logged in user later
      const promiseDeleteImage = unlink(post.imageUrl);
      const promiseDeletePost = Post.findByIdAndRemove(postId);
      return Promise.allSettled([promiseDeleteImage, promiseDeletePost]);
    })
    .then((results) => {
      if (
        results[0].status !== "fulfilled" &&
        results[1].status !== "fulfilled"
      ) {
        throw new Error("Deleting image and the post failed."); // catch() will catch this and forward with next()
      } else if (results[0].status !== "fulfilled") {
        throw new Error("Deleting image failed."); // catch() will catch this and forward with next()
      } else if (results[1].status !== "fulfilled") {
        throw new Error("Deleting post failed."); // catch() will catch this and forward with next()
      } else {
        res.status(200).json({ message: "Deleted post." });
      }
    })
    .catch((err) => {
      next(err);
    });
};
