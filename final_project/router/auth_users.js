const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const {json} = require("express");
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
regd_users.put("/auth/review/:isbn", (req, res) => {
    //Write your code here
    return res.status(300).json({message: "Yet to be implemented"});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
