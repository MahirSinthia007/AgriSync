import { useEffect, useState } from "react";
import { getMyOrders } from "../api/orderApi";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = JSON.parse(localStorage.getItem("user"))?.role;

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <h1>{role === "farmer" ? "Orders Received" : "My Orders"}</h1>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginBottom: "15px" }}>
            <p><strong>Order #{order.orderNumber}</strong></p>
            <p>Status: {order.status}</p>
            <p>
              {role === "farmer" ? "Buyer" : "Farmer"}:{" "}
              {role === "farmer" ? order.buyer?.name : order.farmer?.name}
            </p>
            <ul>
              {order.items.map((item) => (
                <li key={item._id}>
                  {item.product?.name} × {item.quantity} — ৳{Number(item.total).toFixed(2)}
                </li>
              ))}
            </ul>
            <p><strong>Total: ৳{Number(order.totalAmount).toFixed(2)}</strong></p>
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;