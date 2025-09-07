// AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiRequest } from "../utils/api";

export default function AdminPanel() {
  const { user, getAccessTokenSilently } = useAuth0();
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllPurchases() {
      setLoading(true);
      setError("");
      try {
        const token = await getAccessTokenSilently();
        
        // Validate token on server-side for admin access
        const data = await apiRequest("/api/purchases", "GET", null, token);
        setPurchases(data);
      } catch (err) {
        if (err.status === 403) {
          setError("Access denied. You do not have admin privileges.");
        } else {
          setError("Failed to fetch purchases. Please try again.");
        }
        console.error('Admin panel error:', err);
      }
      setLoading(false);
    }
    
    // Always attempt to fetch, let server validate permissions
    if (user) {
      fetchAllPurchases();
    }
  }, [getAccessTokenSilently, user]);

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
        <div className="text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">All Purchases (Admin)</h2>
      {loading && <div className="text-blue-600 mb-2">Loading...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <ul className="divide-y divide-gray-200">
        {purchases.map((purchase, idx) => (
          <li key={idx} className="py-2">
            <div>
              <strong>User:</strong> {purchase.username}
            </div>
            <div>
              <strong>Product:</strong> {purchase.productName}
            </div>
            <div>
              <strong>Date:</strong> {purchase.date}
            </div>
            <div>
              <strong>Delivery Time:</strong> {purchase.deliveryTime}
            </div>
            <div>
              <strong>Location:</strong> {purchase.deliveryLocation}
            </div>
            <div>
              <strong>Quantity:</strong> {purchase.quantity}
            </div>
            <div>
              <strong>Message:</strong> {purchase.message}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
