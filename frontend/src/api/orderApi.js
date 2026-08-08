const API_URL = "http://localhost:5000/api/orders";
const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const getMyOrders = async () => {
  const res = await fetch(`${API_URL}/my`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load orders");
  return data;
};

export const getOrder = async (id) => {
  const res = await fetch(`${API_URL}/${id}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load order");
  return data;
};