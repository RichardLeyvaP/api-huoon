const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const multerCategory = (fieldName, foldername) => {
    // Configuración del almacenamiento
    const storage = multer.diskStorage({
        destination: async function (req, file, cb) {
            let folder = foldername ? `public/${foldername}` : 'public/uploads';
            try {
                await fs.access(folder);
            } catch (error) {
                try {
                    await fs.mkdir(folder, { recursive: true });
                } catch (mkdirError) {
                    return cb(new Error(`Error al crear el directorio: ${mkdirError.message}`));
                }
            }
            cb(null, folder);
        },
        filename: function (req, file, cb) {
            const uniqueName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
            cb(null, uniqueName);
        }
    });

    // Configurar Multer para aceptar un solo archivo, si existe
    const upload = multer({
        storage: storage,
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: function (req, file, cb) {
            const filetypes = /jpeg|jpg|png/;
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);

            if (mimetype && extname) {
                cb(null, true);
            } else {
                cb(new Error('Error: Solo se permiten imágenes (jpeg, jpg, png)'));
            }
        }
    }).single(fieldName);

    // Middleware personalizado para verificar si 'icon' es un archivo o un string
    return async (req, res, next) => {
        if (req.body.icon && typeof req.body.icon === 'string') {
            // Si `icon` es un string, omite el procesamiento del archivo
            return next();
        }
        
        // Si `icon` no es un string, intenta procesarlo como archivo
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    };
};

module.exports = multerCategory;
