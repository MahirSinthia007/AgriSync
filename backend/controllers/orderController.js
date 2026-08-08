const prisma = require('../config/db');

const shapeOrder = (order) => ({
  ...order,
  _id: order.id,
  farmer: order.farmer ? { ...order.farmer, _id: order.farmer.id } : order.farmer,
  buyer: order.buyer ? { ...order.buyer, _id: order.buyer.id } : order.buyer,
  items: order.items
    ? order.items.map((item) => ({
        ...item,
        _id: item.id,
        product: item.product ? { ...item.product, _id: item.product.id } : item.product,
      }))
    : order.items,
});

const getMyOrders = async (req, res) => {
  try {
    const where = req.user.role === 'farmer' ? { farmerId: req.user.id } : { buyerId: req.user.id };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        farmer: { select: { id: true, name: true, phone: true, address: true } },
        buyer: { select: { id: true, name: true, phone: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders.map(shapeOrder));
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        farmer: { select: { id: true, name: true, phone: true, address: true } },
        buyer: { select: { id: true, name: true, phone: true, address: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyerId !== req.user.id && order.farmerId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(shapeOrder(order));
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyOrders, getOrderById };