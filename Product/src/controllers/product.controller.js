const Product = require('../models/product.model');
const { uploadImage } = require('../services/imagekit.service');
const mongoose = require('mongoose');

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
        res.status(200).json({ message: 'Products fetched successfully', products, total: await Product.countDocuments(filter) });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}

async function getProductById(req, res) {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product fetched successfully', product });
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
}

async function updateProduct(req, res) {
    const { id } = req.params;
    
    try {
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findOne({ _id: id});
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }

        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to update this product' });
        }

        const { title, description, priceAmount, priceCurrency } = req.body;
        const price = { amount: Number(priceAmount), currency: priceCurrency || 'INR' };

        const updatedProduct = await Product.findOneAndUpdate({ _id: id }, { title, description, price }, { new: true });
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
}

async function deleteProduct(req, res) {
    const { id } = req.params;
    try {
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        const product = await Product.findOne({ _id: id});
        if (!product) {
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this product' });
        }
        await Product.deleteOne({ _id: id });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
}

async function getSellerProducts(req, res) {
    try {
        const sellerId = req.user.id;
        const { skip=0, limit=20 } = req.query;
        const products = await Product.find({ seller: sellerId }).skip(Number(skip)).limit(Math.min(Number(limit), 20));
        res.status(200).json({ message: 'Seller products fetched successfully', products });
    } catch (error) {
        console.error('Error fetching seller products:', error);
        res.status(500).json({ message: 'Error fetching seller products' });
    }
}

module.exports = { createProduct, getProducts , getProductById, updateProduct, deleteProduct, getSellerProducts};    