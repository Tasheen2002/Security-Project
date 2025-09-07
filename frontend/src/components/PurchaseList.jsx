import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiRequest } from "../utils/api";
import { escapeHtml } from "../utils/validation";

export default function PurchaseList() {
  const { getAccessTokenSilently, isAuthenticated, user, isLoading } =
    useAuth0();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) {
      return; // Wait for Auth0 to finish loading
    }

    if (isAuthenticated) {
      console.log("User is authenticated:", user?.email || user?.sub);
      fetchPurchases();
    } else {
      console.log("User is not authenticated");
      setLoading(false);
      setError("Please log in to view your purchases.");
    }
  }, [isAuthenticated, isLoading]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError("");

      if (!isAuthenticated) {
        setError("Please log in to view your purchases.");
        return;
      }

      console.log("Attempting to get access token...");
      const token = await getAccessTokenSilently();

      console.log("Token retrieved:", token ? "✓ Yes" : "✗ No");
      console.log("Token length:", token ? token.length : 0);

      // Don't try to decode JWE tokens (they're encrypted)
      if (token) {
        console.log(
          "Token type:",
          token.includes(".") && token.split(".").length === 3
            ? "JWT"
            : "JWE (encrypted)"
        );
      }

      const data = await apiRequest("/api/purchases/mine", "GET", null, token);
      setPurchases(data || []);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      if (
        err.message?.includes("consent_required") ||
        err.message?.includes("login_required")
      ) {
        setError("Please log in again to access your purchases.");
      } else {
        setError("Failed to load purchases. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isUpcoming = (dateString) => {
    const deliveryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deliveryDate >= today;
  };

  const upcomingPurchases = purchases.filter((p) => isUpcoming(p.date));
  const pastPurchases = purchases.filter((p) => !isUpcoming(p.date));

  if (loading) {
    return (
      <div className="bg-white shadow rounded p-6 max-w-2xl mx-auto mt-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-blue-600">Loading purchases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">My Purchases</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={fetchPurchases}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {purchases.length === 0 && !error ? (
        <div className="text-center py-8 text-gray-500">
          <p>No purchases found. Make your first purchase above!</p>
        </div>
      ) : (
        <div>
          {upcomingPurchases.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-green-700">
                Upcoming Deliveries ({upcomingPurchases.length})
              </h3>
              <ul className="divide-y divide-gray-200 border rounded-lg">
                {upcomingPurchases.map((purchase, idx) => (
                  <li key={`upcoming-${idx}`} className="p-4 bg-green-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Product:</strong>{" "}
                        {escapeHtml(purchase.productName)}
                      </div>
                      <div>
                        <strong>Quantity:</strong> {purchase.quantity}
                      </div>
                      <div>
                        <strong>Date:</strong> {formatDate(purchase.date)}
                      </div>
                      <div>
                        <strong>Time:</strong>{" "}
                        {escapeHtml(purchase.deliveryTime)}
                      </div>
                      <div className="col-span-2">
                        <strong>Location:</strong>{" "}
                        {escapeHtml(purchase.deliveryLocation)}
                      </div>
                      {purchase.message && (
                        <div className="col-span-2">
                          <strong>Message:</strong>{" "}
                          {escapeHtml(purchase.message)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pastPurchases.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Past Orders ({pastPurchases.length})
              </h3>
              <ul className="divide-y divide-gray-200 border rounded-lg">
                {pastPurchases.map((purchase, idx) => (
                  <li key={`past-${idx}`} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Product:</strong>{" "}
                        {escapeHtml(purchase.productName)}
                      </div>
                      <div>
                        <strong>Quantity:</strong> {purchase.quantity}
                      </div>
                      <div>
                        <strong>Date:</strong> {formatDate(purchase.date)}
                      </div>
                      <div>
                        <strong>Time:</strong>{" "}
                        {escapeHtml(purchase.deliveryTime)}
                      </div>
                      <div className="col-span-2">
                        <strong>Location:</strong>{" "}
                        {escapeHtml(purchase.deliveryLocation)}
                      </div>
                      {purchase.message && (
                        <div className="col-span-2">
                          <strong>Message:</strong>{" "}
                          {escapeHtml(purchase.message)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
