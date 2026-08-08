const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, checkout } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.post('/checkout', protect, checkout);
router.put('/:productId', protect, updateCartItem);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;