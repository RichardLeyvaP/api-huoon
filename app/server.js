const express = require("express");
const app = express();
const admin = require('firebase-admin');
const { sequelize } = require("./models/index");
const serviceAccount = require('../config/serviceAccountKey.json');
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const i18n = require("../config/i18n-config"); // Importar la configuración de i18n
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const cors = require("cors");
require ('../cron/taskCron')

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_ID,
      clientSecret: process.env.GOOGLE_OAUTH_KEY,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ["profile", "email"], // Asegúrate de incluir estos alcances
    },
    (accessToken, refreshToken, profile, done) => {
      // No llamar a done aquí, solo pasar el perfil a la ruta
      // Acceso a los datos
      const userId = profile.id;
      const userName = profile.displayName;
      const userEmail = profile.emails
        ? profile.emails[0].value
        : "No disponible";
      const userData = {
        id: userId, // ID del usuario en Google
        name: userName, // Nombre del usuario
        email: userEmail, // Email del usuario
        image: profile.photos[0]?.value, // URL de la imagen de perfil
      };
      console.log("Datos del usuario:", userData); // Para verificar que se está creando correctamente
      done(null, userData);
    }
  )
);

// Configura la estrategia de Facebook
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_OAUTH_ID,
      clientSecret: process.env.FACEBOOK_OAUTH_KEY,
      callbackURL: process.env.FACEBOOK_REDIRECT_URI,
      profileFields: ["id", "displayName", "emails", "photos"], // Especifica los datos que necesitas
    },
    (accessToken, refreshToken, profile, done) => {
      // Extrae la información del perfil del usuario
      const userId = profile.id;
      const userName = profile.displayName;
      const userEmail = profile.emails
        ? profile.emails[0].value
        : "No disponible";
      const userData = {
        id: userId,
        name: userName,
        email: userEmail,
        image: profile.photos[0]?.value, // URL de la imagen de perfil
      };

      console.log("Datos del usuario desde Facebook:", userData); // Log para verificar los datos del usuario
      done(null, userData);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configuración de sesión
app.use(
  session({
    secret: "tu_secreto_aqui",
    resave: false,
    saveUninitialized: true,
  })
);
//settings
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    //origin: 'http://localhost:8080',  // Asegúrate de permitir tu dominio frontend
    allowedHeaders: ["Authorization", "Content-Type"], // Asegúrate de que 'Authorization' esté permitido
    credentials: true,
  })
); // Habilita CORS para todos los orígenes

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware para gestionar el idioma
app.use(cookieParser());
app.use(i18n.init); // Inicializar i18n como middleware

app.use(passport.initialize());
app.use(passport.session());
//Rutas
app.use("/api", require("./routes"));

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  sequelize
    .authenticate()
    .then(() => {
      console.log("Conexión a la base de datos exitosa");
    })
    .catch((error) => {
      console.error("Error al conectar a la base de datos:", error);
      process.exit(1); // Sale si no puede conectar con la DB
    });
});

// Maneja la señal SIGINT para cerrar conexiones y el servidor
process.on("SIGINT", async () => {
  try {
    console.log("Cerrando la conexión a la base de datos...");
    await sequelize.close(); // Cierra la conexión a la base de datos
    console.log("Conexión a la base de datos cerrada.");

    server.close(() => {
      console.log("Servidor cerrado.");
      process.exit(0); // Sale de la aplicación correctamente
    });
  } catch (error) {
    console.error("Error al cerrar la conexión a la base de datos:", error);
    process.exit(1); // Si ocurre un error, termina con código de error
  }
});
