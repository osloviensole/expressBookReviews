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
        const username = req.user.data; // Récupérer username depuis le token
        const isbnReview = req.params.isbn; // Récupérer l'ISBN depuis les paramètres de l'URL
        const { isbn, review } = req.body; // Extraire la critique depuis le body

        // Vérifier la présence des données requises
        if (!isbn || !review) {
            return res.status(400).json({ message: "ISBN and review are required" });
        }

        // Fonction pour trouver un livre de manière asynchrone
        const findBookByISBN = async (isbn) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const book =  Object.values(books).find(b => b.isbn === isbn);
                    console.log(`The isbn : ${isbn}`);
                    if (book) {
                        console.log(`The title of book : ${book.title}`);
                        resolve(book); // Livre trouvé
                    } else {
                        reject(new Error(`Book with ISBN ${isbn} not found`)); // Livre non trouvé
                    }
                }, 50); // Simule un délai asynchrone de 50 ms
            });
        };

        // Recherche asynchrone du livre
        const book = await findBookByISBN(isbn);

        // Vérification des critiques pour ce livre
        if (!Array.isArray(book.reviews)) {
            book.reviews = []; // Initialise les critiques si elles n'existent pas encore
        }

        let idReview;

        // Trouver une critique existante avec le même ISBN
        const existingReview = book.reviews.find(review => review.isbn === isbnReview);

        if (!existingReview) {
            // Si aucune critique existante n'est trouvée, génère un nouvel ID
            idReview = uuidv4();
        } else {
            // Si une critique existe déjà, on garde l'ID de l'ISBN
            existingReview.message = review;

            return res.status(200).json({
                reviews: book
            });
        }

        const reviewStructure = {
            isbn: idReview,
            author: username,
            message: review
        };

        book.reviews.push(reviewStructure);


        // Réponse de succès
        return res.status(200).json({
            book: book,
        });

    } catch (error) {
        // Gestion des erreurs
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({
            message: error.message,
        });
    }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
