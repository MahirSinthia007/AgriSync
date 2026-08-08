import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, updateCartItem, removeFromCart, checkout } from "../api/cartApi";

function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getCart());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await updateCartItem(productId, quantity);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      setItems((prev) => prev.filter((i) => i.product._id !== productId));
    } catch (err) {
      setError(err.message);
    }
  };

  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setError("");
    try {
      await checkout({ deliveryAddress, deliveryNotes, paymentMethod });
      navigate("/orders");
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <p>Loading cart...</p>;

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 20px" }}>
      <h1>My Cart</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {items.map((item) => (
            <div
              key={item._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "10px",
              }}
            >
              <div>
                <strong>{item.product.name}</strong>
                <p style={{ margin: 0 }}>৳{item.product.price} each</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                  Sold by {item.product.farmer?.name}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.product._id, parseInt(e.target.value) || 1)
                  }
                  style={{ width: "60px" }}
                />
                <button onClick={() => handleRemove(item.product._id)}>Remove</button>
              </div>
            </div>
          ))}

          <h3>Total: ৳{total.toFixed(2)}</h3>

          <form onSubmit={handleCheckout} style={{ marginTop: "20px" }}>
            <label>
              Delivery Address
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
              />
            </label>

            <label>
              Notes (optional)
              <input
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
              />
            </label>

            <label>
              Payment Method
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ display: "block", padding: "8px", marginBottom: "10px" }}
              >
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="mobile_banking">Mobile Banking</option>
                <option value="online_transfer">Online Transfer</option>
                <option value="card">Card</option>
              </select>
            </label>

            <button type="submit" disabled={placing}>
              {placing ? "Placing order..." : "Place Order"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Cart;