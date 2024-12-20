const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let isPasswordValid = require("./auth_users.js").isPasswordValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


// Route pour l'enregistrement d'un nouvel utilisateur
public_users.post("/register", (req, res) => {
  const { username, password, DOB } = req.body;  // On attend ces informations dans le body de la requête

  // Vérifier si tous les champs sont présents
  if (!username || !password || !DOB) {
    return res.status(400).json({ message: "Username, password, and date of birth are required" });
  }

  // Vérifier si le nom d'utilisateur est valide
  if (!isValid(username)) {
    return res.status(400).json({ message: "Username is already taken or invalid" });
  }

  // Vérifier si le mot de passe est valide
  if (!isPasswordValid(password)) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  // Ajouter le nouvel utilisateur à la liste
  const newUser = { username, password, DOB };
  users.push(newUser);

  // Répondre avec un message de succès
  return res.status(201).json({
    message: "User registered successfully",
    user: { username, DOB }
  });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    // Simuler une fonction asynchrone pour récupérer les livres
    const fetchBooks = async () => {
      return new Promise((resolve, reject) => {
        if (Object.keys(books).length === 0) {
          reject("No books available");
        } else {
          resolve(books);
        }
      });
    };

    const bookList = await fetchBooks();
    return res.status(200).json({
      books: JSON.parse(JSON.stringify(bookList))
    });

  } catch (error) {
    return res.status(404).json({ message: error });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn; // Récupère l'ISBN depuis les paramètres de la requête

  // Recherche le livre directement dans l'objet books par sa clé (qui correspond à l'ISBN)
  const book = books[isbn];

  // Si le livre n'existe pas, renvoyer une erreur
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Renvoyer le livre trouvé
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

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const reviewIsbn = req.params.isbn;

  // Recherche dans tous les livres pour trouver une critique par son ISBN
  const book = Object.values(books).find(book =>
      book.reviews && book.reviews[reviewIsbn] // Vérifie si la critique avec l'ISBN existe dans les critiques
  );

  if (!book) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Récupérer la critique spécifique
  const review = book.reviews[reviewIsbn];

  return res.status(200).json({
    review: review // Renvoie la critique trouvée
  });
});


module.exports.general = public_users;
