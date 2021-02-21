const cloudinary = require('cloudinary').v2
require('dotenv').config()
const { cloudinaryStorage, CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'SecureSend',
        allowedFormats: ['jpeg', 'png', 'jpg', 'jfif']
    },
})

module.exports = {
    cloudinary,
    storage
}