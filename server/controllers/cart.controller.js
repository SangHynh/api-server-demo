const Product = require("../models/product.model");
const User = require("../models/user.model");

class CartController {
    // GET CART BY USER ID
    async getCartByUserId(req, res) {
        try {
            const accountId = req.payload.aud

            console.log(req.payload.aud)
            // const { userId } = req.params.id;
            const response = await User.findOne({ accountId: accountId });

            if (!response) return res.status(404).json("User not found")

            return res.status(200).json({ carts: response.carts })
        } catch (error) {
            return res.status(500).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }

    // ADD CART'S ITEM
    async addCartItem(req, res) {
        try {
            const productId = req.params.id;

            const { quantity } = req.body;

            const accountId = req.payload.aud
            // const { userId } = req.params.id;
            const user = await User.findOne({ accountId: accountId });

            if (!user) return res.status(404).json("User not found")

            const product = await Product.findById(productId)
            if (!product) {
                return res.status(404).json({ message: 'Product not found' })
            }

            const existingItem = user.carts.find(item => item.productId.toString() === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            }
            else {
                user.carts.push({
                    productId: productId,
                    productName: product.name,
                    price: product.price,
                    quantity: quantity,
                    images: product.images,
                })
            }

            await user.save();

            return res.status(200).json({ message: 'Product added to cart', carts: user.carts });
        } catch (error) {
            return res.status(400).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }

    // REDUCE CART'S ITEM
    async reduceCartItem(req, res) {
        try {
            const productId = req.params.id;
            const { quantity } = req.body;
            const accountId = req.payload.aud

            const user = await User.findOne({ accountId: accountId });
            if (!user) return res.status(404).json("User not found");

            const cartItem = user.carts.find(item => item.productId.toString() === productId);
            if (!cartItem) {
                return res.status(404).json({ message: 'Product not found in cart' });
            }

            if (cartItem.quantity - quantity < 1) {
                return res.status(400).json({ message: 'Cannot reduce quantity below 1 (Call removeCartItem)' });
            }

            cartItem.quantity -= quantity;

            await user.save();

            return res.status(200).json({ message: 'Cart item quantity reduced', carts: user.carts });
        } catch (error) {
            return res.status(500).json({
                error: error.message,
                message: 'An error occurred while reducing cart item quantity'
            });
        }
    }

    // REMOVE CART'S ITEM
    async removeCartItem(req, res) {
        try {
            const productId = req.params.id;

            const accountId = req.payload.aud
            // const { userId } = req.params.id;
            const user = await User.findOne({ accountId: accountId });

            if (!user) return res.status(404).json("User not found")

            user.carts = user.carts.filter(item => item.productId.toString() !== productId);

            await user.save();

            return res.status(200).json({ message: 'Product removed from cart', carts: user.carts });
        } catch (error) {
            return res.status(400).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }
}

module.exports = new CartController()