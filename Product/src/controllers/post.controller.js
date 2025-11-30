const Product = require('../models/product.model');
const { uploadImage } = require('../services/imagekit.service');

async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency } = req.body;
        const sellerId = req.user.id;

        const price = { amount: Number(priceAmount), currency: priceCurrency || 'INR' };

        const files = req.files || [];

        const images = await Promise.all(
            files.map(async (file) => {
                const uploaded = await uploadImage({ buffer: file.buffer });

                return {
                    url: uploaded.url,
                    thumbnail: uploaded.thumbnailUrl || uploaded.url,
                    id: uploaded.fileId,
                };
            })
        );
        const newProduct = new Product({
            title,
            description,
            price,
            seller: sellerId,
            images
        });

        await newProduct.save();
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
}

async function getProducts(req, res) {
    const {q,minPrice,maxPrice,skip=0,limit=20} = req.query;
    try {
        const filter = {};

        if (q) {
            filter.$text = { $search: q };
        }
        if (minPrice || maxPrice) {
            filter['price.amount'] = {};
            if (minPrice) {
                filter['price.amount'].$gte = Number(minPrice);
            }
            if (maxPrice) {
                filter['price.amount'].$lte = Number(maxPrice);
            }
        }
        const products = await Product.find(filter).skip(Number(skip)).limit(Number(limit));
        res.status(200).json({ message: 'Products fetched successfully', products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}

module.exports = { createProduct, getProducts };