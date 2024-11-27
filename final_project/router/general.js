const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  //Write your code here
  return res.status(300).json({message: "on attends"});
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  // Assuming booksdb.js exports an array of book objects
  if (books.length === 0) {
    return res.status(404).json({ message: "No books available" });
  }

  // JSON.stringify to return a neatly formatted list of books
  return res.status(200).json({
    books: JSON.parse(JSON.stringify(books))
  });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Convert the books object to an array and find the book by ISBN (or number)
  const book = Object.values(books).find(book => book.author === isbn); // Or use any other key, e.g. `book.isbn`

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({
    book: book
  });
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;

  // Convert the books object to an array and find the book by Author
  const book = Object.values(books).find(book => book.author === author);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({
    book: book
  });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;

  // Convert the books object to an array and find the book by Author
  const book = Object.values(books).find(book => book.title === title);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({
    book: book
  });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

module.exports.general = public_users;
