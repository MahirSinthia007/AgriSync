const prisma = require('../config/db');

const shapeCartItem = (item) => ({
  ...item,
  _id: item.id,
  product: item.product
    ? {
        ...item.product,
        _id: item.product.id,
        farmer: item.product.farmer
          ? { ...item.product.farmer, _id: item.product.farmer.id }
          : item.product.farmer,
      }
    : item.product,
});

const getCart = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers have a cart' });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { farmer: { select: { id: true, name: true, phone: true, address: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items.map(shapeCartItem));
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can add to cart' });
    }

    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const qty = quantity && quantity > 0 ? parseInt(quantity) : 1;
    const includeOpts = {
      product: { include: { farmer: { select: { id: true, name: true, phone: true, address: true } } } },
    };

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    const item = existing
      ? await prisma.cartItem.update({
          where: { userId_productId: { userId: req.user.id, productId } },
          data: { quantity: existing.quantity + qty },
          include: includeOpts,
        })
      : await prisma.cartItem.create({
          data: { userId: req.user.id, productId, quantity: qty },
          include: includeOpts,
        });

    res.status(201).json(shapeCartItem(item));
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      await prisma.cartItem
        .delete({ where: { userId_productId: { userId: req.user.id, productId } } })
        .catch(() => {});
      return res.json({ message: 'Item removed from cart' });
    }

    const item = await prisma.cartItem.update({
      where: { userId_productId: { userId: req.user.id, productId } },
      data: { quantity: parseInt(quantity) },
      include: {
        product: { include: { farmer: { select: { id: true, name: true, phone: true, address: true } } } },
      },
    });

    res.json(shapeCartItem(item));
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    await prisma.cartItem.delete({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: error.message });
  }
};

const checkout = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can place orders' });
    }

    const { deliveryAddress, deliveryNotes, paymentMethod } = req.body;
    if (!deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // An Order belongs to exactly one farmer, so split the cart by farmer
    const groups = {};
    for (const item of cartItems) {
      const farmerId = item.product.farmerId;
      if (!groups[farmerId]) groups[farmerId] = [];
      groups[farmerId].push(item);
    }

    // Validate stock across the whole cart before creating anything
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for "${item.product.name}" (only ${item.product.stock} left)`,
        });
      }
    }

    const createdOrders = [];

    for (const farmerId of Object.keys(groups)) {
      const items = groups[farmerId];

      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      );

      const orderNumber = `AGR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          buyerId: req.user.id,
          farmerId,
          totalAmount,
          deliveryAddress,
          deliveryNotes: deliveryNotes || null,
          paymentMethod: paymentMethod || 'cash_on_delivery',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              total: Number(item.product.price) * item.quantity,
            })),
          },
          statusHistory: {
            create: { status: 'pending', notes: 'Order placed by buyer' },
          },
        },
        include: {
          items: { include: { product: true } },
          farmer: { select: { id: true, name: true, phone: true, address: true } },
        },
      });

      createdOrders.push({ ...order, _id: order.id });
    }

    // Note: stock is validated above but NOT decremented here on purpose —
    // that's handled by Inventory Management (a separate Sprint 2 feature).
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

    res.status(201).json(createdOrders);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, checkout };