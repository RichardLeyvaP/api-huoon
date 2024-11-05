const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');
const { runWithUser } = require('../../config/context');

module.exports = (req, res, next) => {

    //console.log(req.headers);

    //comprobar que exista el token
    if (!req.headers.authorization) {
        res.status(401).json({ msg: "Acceso no autorizado"});
    }else{
        let token = req.headers.authorization.split(" ")[1];
        //Comprobar la validez del token
        jwt.verify(token, authConfig.secret, (err, decoded) => {
            if (err) {
                res.status(500).json({ msg: "ha ocurrido un problema al decodificar el token", err});
            }else{  
                // Almacenar el ID del usuario en el contexto
            runWithUser(decoded.user.id, () => {
                req.user = decoded.user; // Puedes mantenerlo si necesitas acceder a otros datos del usuario en `req.user`
                req.person = decoded.user.person; // Puedes mantenerlo si necesitas acceder a otros datos del usuario en `req.user`
                next(); // Llama a la siguiente función de middleware
            });  
                //req.user = decoded.user;        
             //next();
            }
        });

    }

};