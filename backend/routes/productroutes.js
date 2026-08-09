const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getMyProducts,
  getRecommendations,
  recordProductView,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Create a product (Farmer only)
router.post("/", protect, createProduct);

// View all products
router.get("/", getProducts);

// Get MY products (Farmer only)
router.get("/my", protect, getMyProducts);

// GET Smart Recommendations
router.get("/recommendations", protect, getRecommendations);

// View one product
router.get("/:id", getProductById);

// Record a product view for the recommendation engine
router.post("/:id/view", protect, recordProductView);

// Update product
router.put("/:id", protect, updateProduct);

// Delete product
router.delete("/:id", protect, deleteProduct);

// Upload product image
router.put(
  "/:id/image",
  protect,
  upload.single("productImage"),
  uploadProductImage
);

module.exports = router;