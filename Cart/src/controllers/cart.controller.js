const Cart = require('../models/cart.model');

// Add item to cart
async function addItemToCart(req, res) {
    const { productId, quantity } = req.body;
    const user = req.user.id;
    let cart = await Cart.findOne({ userId: user });
    if (!cart) {
        cart = new Cart({ userId: user, items: [] });
    }
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
    } 
    else {
        cart.items.push({ productId, quantity });
    }
    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cart });
}

async function getCartItems(req, res) {
    const user = req.user.id;
    const cart = await Cart.findOne({ userId: user });
    if (!cart) {
        return res.status(200).json({ items: [] });
    }
    res.status(200).json({ items: cart.items });
}

async function removeItemFromCart(req, res) {
    const user = req.user.id;
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: user });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();
    res.status(200).json({ message: 'Item removed from cart', cart });
}
async function clearCart(req, res) {
    const user = req.user.id;
    const cart = await Cart.findOne({ userId: user });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    cart.items = [];
    await cart.save();
    res.status(200).json({ message: 'Cart cleared', cart });
}

async function updateItemQuantity(req, res) {
    const user = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: user });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    const item = cart.items.find(item => item.productId === productId);
    if (!item) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }
    item.quantity = quantity;
    await cart.save();
    res.status(200).json({ message: 'Item quantity updated', cart });
}



module.exports = {
    addItemToCart,
    getCartItems,
    removeItemFromCart,
    clearCart,
    updateItemQuantity,
};