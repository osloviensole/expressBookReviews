const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const { v4: uuidv4 } = require('uuid');
const regd_users = express.Router();

let users = [
    {
        "username": "Jiwe",
        "password": "revolt",
        "DOB": "27/11/2024"
    },
    {
        "username": "Bold",
        "password": "lantern",
        "DOB": "21/12/2006"
    },
];

const isValid = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!username || !usernameRegex.test(username)) {
        return false;
    }

    const userExists = users.some(user => user.username === username);
    return !userExists;
};

// Fonction pour valider un mot de passe
const isPasswordValid = (password) => {
    // Vérifie si le mot de passe est présent et a une longueur minimale de 6 caractères
    if (!password || password.length < 6) {
        return false;
    }

    // Vérifie si le mot de passe contient au moins une lettre majuscule
    if (!/[A-Z]/.test(password)) {
        return false;
    }

    // Vérifie si le mot de passe contient au moins une lettre minuscule
    if (!/[a-z]/.test(password)) {
        return false;
    }

    // Vérifie si le mot de passe contient au moins un chiffre
    if (!/[0-9]/.test(password)) {
        return false;
    }

    // Vérifie si le mot de passe contient au moins un caractère spécial (par exemple, !@#$%^&*)
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
    }

    // Si toutes les conditions sont remplies, le mot de passe est valide
    return true;
};


const authenticatedUser = (username, password) => {
    const user = users.find(user => user.username === username && user.password === password);
    return !!user;
};

//only registered users can login
regd_users.post("/login", (req, res) => {
    const {username, password} = req.body; // Récupérer les informations d'identification

    // Vérifier si le corps de la requête contient les informations nécessaires
    if (!username || !password) {
        return res.status(400).json({message: "Username or password missing"});
    }

    // Vérifier si l'utilisateur est authentifié
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({message: "Invalid username or password"});
    }

    // Récupérer l'objet utilisateur (optionnel : à partir de la base ou d'une liste)
    const user = users.find(u => u.username === username);

    // Supprimer le mot de passe de l'objet utilisateur avant de le renvoyer
    const {password: _, ...userWithoutPassword} = user;

    // Générer le token JWT
    const accessToken = jwt.sign(
        {data: username},  // On peut aussi ajouter des claims personnalisés si nécessaire
        'access',
        {expiresIn: 60 * 60} // Expiration : 1 heure
    );

    // Stocker le token dans la session
    req.session.authorization = {
        accessToken
    };

    // Réponse réussie
    return res.status(200).json({user: userWithoutPassword, accessToken});
});

// Add a book review
regd_users.put("/auth/review/:isbn", async (req, res) => {
    try {
        const username = req.user.data; // Récupérer l'utilisateur depuis le token
        const reviewIsbn = req.params.isbn; // ISBN de la critique (paramètre URL)
        const { isbn: bookIsbn, review } = req.body; // ISBN du livre et nouvelle critique (corps de la requête)

        // Vérifier la présence des données requises
        if (!bookIsbn || !review) {
            return res.status(400).json({ message: "Book ISBN and review are required." });
        }

        // Recherche le livre directement dans l'objet books par sa clé (qui correspond à l'ISBN)
        const book = books[bookIsbn];

        if (!book) {
            return res.status(404).json({ message: `Book with ISBN ${bookIsbn} not found.` });
        }

        // Initialiser les critiques si elles n'existent pas
        if (!book.reviews || typeof book.reviews !== "object") {
            book.reviews = {};
        }

        // Chercher une critique existante avec le même ISBN
        const existingReview = book.reviews[reviewIsbn];

        if (existingReview) {
            // Vérifier si l'utilisateur est l'auteur de la critique
            if (existingReview.author !== username) {
                // Ajouter une nouvelle critique avec un nouvel ISBN (length + 1)
                const newReviewIsbn = String(Object.keys(book.reviews).length + 1);
                book.reviews[newReviewIsbn] = {
                    author: username,
                    message: review
                };

                return res.status(201).json({
                    message: "New review added successfully.",
                    reviews: book.reviews
                });
            }

            // Mettre à jour la critique existante
            existingReview.message = review;

            return res.status(200).json({
                message: "Review updated successfully.",
                reviews: book.reviews
            });
        }

        // Ajouter une nouvelle critique si aucune n'est trouvée
        book.reviews[reviewIsbn] = {
            author: username,
            message: review
        };

        // Réponse de succès
        return res.status(201).json({
            message: "New review added successfully.",
            reviews: book.reviews
        });

    } catch (error) {
        // Gestion des erreurs
        return res.status(500).json({
            message: error.message || "An error occurred."
        });
    }
});

regd_users.delete("/auth/review/delete/:isbn", (req, res) => {
    try {
        const username = req.user.data; // Nom d'utilisateur récupéré depuis le token
        const reviewIsbn = req.params.isbn; // ISBN de la critique à supprimer

        // Recherche du livre contenant la critique
        const book = Object.values(books).find(book =>
            book.reviews && book.reviews[reviewIsbn]
        );

        if (!book) {
            return res.status(404).json({ message: "Review not found" });
        }

        const review = book.reviews[reviewIsbn];

        // Vérification de l'auteur de la critique
        if (review.author !== username) {
            return res.status(403).json({
                message: "You are not authorized to delete this review"
            });
        }

        // Suppression de la critique
        delete book.reviews[reviewIsbn];

        return res.status(200).json({
            message: "Review deleted successfully",
            reviews: book.reviews
        });
    } catch (error) {
        // Gestion des erreurs
        return res.status(500).json({
            message: "An error occurred",
            error: error.message
        });
    }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
