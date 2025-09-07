import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiRequest } from "../utils/api";
import { useCart } from "../context/CartContext";

export default function ProductList() {
  const { isAuthenticated } = useAuth0();
  const { addToCart, error: cartError, clearError } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🛍️ Fetching products...");
      const data = await apiRequest("/api/products", "GET", null, null, false);
      console.log("📦 Products API response:", data);
      console.log("📦 Data type:", typeof data);
      console.log("📦 Is array:", Array.isArray(data));

      // Ensure we always set an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        console.warn("⚠️ API returned non-array data:", data);
        setProducts([]);
      }
    } catch (err) {
      setError("Failed to load products. Please try again.");
      console.error("❌ Error fetching products:", err);
      setProducts([]); // Ensure products is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      setError("Please log in to add items to cart");
      return;
    }

    setAddingToCart(productId);
    const success = await addToCart(productId, 1);

    if (success) {
      // Show success message briefly
      setTimeout(() => {
        clearError();
      }, 3000);
    }

    setAddingToCart(null);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded p-6 max-w-4xl mx-auto mt-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-blue-600">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded p-6 max-w-4xl mx-auto mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={fetchProducts}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded p-6 max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Available Products</h2>

      {(error || cartError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || cartError}
          <button
            onClick={() => {
              setError("");
              clearError();
              if (error) fetchProducts();
            }}
            className="ml-2 text-sm underline hover:no-underline"
          >
            {error ? "Retry" : "Dismiss"}
          </button>
        </div>
      )}

      {!Array.isArray(products) ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Warning: Invalid product data received. Please refresh the page.
          <button
            onClick={fetchProducts}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Refresh
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No products available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(products) &&
            products.map((product) => (
              <div
                key={product._id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-green-600">
                    ${product.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(product._id)}
                  disabled={addingToCart === product._id || product.stock === 0}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    product.stock === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : addingToCart === product._id
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {addingToCart === product._id
                    ? "Adding..."
                    : product.stock === 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
