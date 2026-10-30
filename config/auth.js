require("dotenv").config();

const secret = process.env.AUTH_SECRET;

if (!secret) {
    throw new Error("AUTH_SECRET es obligatorio y debe configurarse en el entorno");
}

module.exports = {
    secret,
    expires: process.env.AUTH_EXPIRES || "24h",
    rounds: process.env.AUTH_ROUNDS || 10
}
