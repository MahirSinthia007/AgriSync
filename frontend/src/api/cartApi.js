const API_URL = "http://localhost:5000/api/cart";
const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const getCart = async () => {
  const res = await fetch(API_URL, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load cart");
  return data;
};

export const addToCart = async (productId, quantity = 1) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ productId, quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add to cart");
  return data;
};

export const updateCartItem = async (productId, quantity) => {
  const res = await fetch(`${API_URL}/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update cart");
  return data;
};

export const removeFromCart = async (productId) => {
  const res = await fetch(`${API_URL}/${productId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to remove item");
  return data;
};

export const checkout = async (checkoutData) => {
  const res = await fetch(`${API_URL}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(checkoutData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Checkout failed");
  return data;
};