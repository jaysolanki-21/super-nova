const imagekit = require('imagekit');
const { v4 : uuidv4 } = require('uuid')

const ik = new imagekit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadImage({ buffer, folder = '/supernova/products' }) {
    try {
        const response = await ik.upload({
            file: buffer,
            fileName: uuidv4(),
            folder: folder
        });
        return {
            url: response.url,
            thumbnailUrl: response.thumbnailUrl || response.url,
            fileId: response.fileId
        };
    } catch (error) {
        throw new Error('Image upload failed');
    }
}

module.exports = { uploadImage, ik };