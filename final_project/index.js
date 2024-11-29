const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req, res, next) {
    // Vérifier si l'en-tête Authorization existe et contient un token
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // On récupère la partie après 'Bearer'

    if (!token) {
        return res.status(401).json({message: "Token missing, authorization required"});
    }

    // Vérifier la validité du token avec jwt.verify()
    jwt.verify(token, 'access', (err, decoded) => {
        if (err) {
            return res.status(403).json({message: "Invalid or expired token"});
        }
        // Si le token est valide, on ajoute l'information décodée au request object pour l'utiliser dans les routes suivantes
        req.user = decoded; // Le 'decoded' contient les informations du payload, ici on a 'data' (le username)
        next(); // Passer à la route suivante
    });
});

const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
