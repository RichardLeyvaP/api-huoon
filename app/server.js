
const express = require('express');
const app = express();
const { sequelize } = require('./models/index');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_OAUTH_ID,
  clientSecret: process.env.GOOGLE_OAUTH_KEY,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
  scope: ['profile', 'email'] // Asegúrate de incluir estos alcances
}, (accessToken, refreshToken, profile, done) => {
  // No llamar a done aquí, solo pasar el perfil a la ruta
   // Acceso a los datos
   const userId = profile.id;
   const userName = profile.displayName;
   const userEmail = profile.emails ? profile.emails[0].value : 'No disponible';
  const userData = {
    id: userId, // ID del usuario en Google
    name: userName, // Nombre del usuario
    email: userEmail, // Email del usuario
    image: profile.photos[0]?.value // URL de la imagen de perfil
  };
   console.log('Datos del usuario:', userData); // Para verificar que se está creando correctamente
  done(null, userData);
}));

// Configura la estrategia de Facebook
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_OAUTH_ID,
  clientSecret: process.env.FACEBOOK_OAUTH_KEY,
  callbackURL: process.env.FACEBOOK_REDIRECT_URI,
  profileFields: ['id', 'displayName', 'emails', 'photos'] // Especifica los datos que necesitas
},
(accessToken, refreshToken, profile, done) => {
  // Extrae la información del perfil del usuario
  const userId = profile.id;
  const userName = profile.displayName;
  const userEmail = profile.emails ? profile.emails[0].value : 'No disponible';
  const userData = {
      id: userId,
      name: userName,
      email: userEmail,
      image: profile.photos[0]?.value // URL de la imagen de perfil
  };

  console.log('Datos del usuario desde Facebook:', userData); // Log para verificar los datos del usuario
  done(null, userData);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configuración de sesión
app.use(session({
  secret: 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: true
}));
//settings
const PORT = process.env.PORT || 8000;

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false}));

app.use(passport.initialize());
app.use(passport.session());
//Rutas
app.use('/api', require('./routes'));

app.listen(PORT, () => {
  console.log(`Example app listening on http://localhost:${PORT}!`);
  sequelize.authenticate().then(() => {
    console.log('Nos hemos conectado a la base de datos!!!!');
  })
});