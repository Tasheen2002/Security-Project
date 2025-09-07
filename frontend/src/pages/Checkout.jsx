import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { validateEmail, sanitizeInput } from "../utils/validation";

const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Moneragala",
  "Ratnapura",
  "Kegalle",
];

export default function Checkout() {
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });

  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchCartItems();
  }, [isAuthenticated, navigate]);

  const fetchCartItems = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest("/api/cart", "GET", null, token);
      setCartItems(response.items || []);

      if (!response.items || response.items.length === 0) {
        navigate("/cart");
      }
    } catch (error) {
      console.error("Failed to fetch cart items:", error);
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    const sanitizedValue = sanitizeInput(value);

    if (section === "shipping") {
      setShippingInfo((prev) => ({
        ...prev,
        [field]: sanitizedValue,
      }));
    } else if (section === "billing") {
      setBillingInfo((prev) => ({
        ...prev,
        [field]: sanitizedValue,
      }));
    }

    if (errors[`${section}.${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`${section}.${field}`]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate shipping info
    if (!shippingInfo.firstName)
      newErrors["shipping.firstName"] = "First name is required";
    if (!shippingInfo.lastName)
      newErrors["shipping.lastName"] = "Last name is required";
    if (!shippingInfo.email) newErrors["shipping.email"] = "Email is required";
    else if (!validateEmail(shippingInfo.email))
      newErrors["shipping.email"] = "Invalid email format";
    if (!shippingInfo.phone)
      newErrors["shipping.phone"] = "Phone number is required";
    if (!shippingInfo.address)
      newErrors["shipping.address"] = "Address is required";
    if (!shippingInfo.city) newErrors["shipping.city"] = "City is required";
    if (!shippingInfo.district)
      newErrors["shipping.district"] = "District is required";
    if (!shippingInfo.postalCode)
      newErrors["shipping.postalCode"] = "Postal code is required";

    // Validate billing info if different from shipping
    if (!sameAsShipping) {
      if (!billingInfo.firstName)
        newErrors["billing.firstName"] = "First name is required";
      if (!billingInfo.lastName)
        newErrors["billing.lastName"] = "Last name is required";
      if (!billingInfo.email) newErrors["billing.email"] = "Email is required";
      else if (!validateEmail(billingInfo.email))
        newErrors["billing.email"] = "Invalid email format";
      if (!billingInfo.phone)
        newErrors["billing.phone"] = "Phone number is required";
      if (!billingInfo.address)
        newErrors["billing.address"] = "Address is required";
      if (!billingInfo.city) newErrors["billing.city"] = "City is required";
      if (!billingInfo.district)
        newErrors["billing.district"] = "District is required";
      if (!billingInfo.postalCode)
        newErrors["billing.postalCode"] = "Postal code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 0; // Free shipping
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError("");

    try {
      const token = await getAccessTokenSilently();
      const orderData = {
        items: cartItems,
        shipping: shippingInfo,
        billing: sameAsShipping ? shippingInfo : billingInfo,
        paymentMethod,
        totals: calculateTotal(),
      };

      const response = await apiRequest(
        "/api/orders",
        "POST",
        orderData,
        token
      );

      // Clear cart after successful order
      await apiRequest("/api/cart/clear", "POST", null, token);

      // Navigate to order confirmation
      navigate(`/order-confirmation/${response.orderId}`);
    } catch (error) {
      console.error("Failed to place order:", error);
      setError("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading checkout...
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <form onSubmit={handleSubmit}>
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.firstName}
                    onChange={(e) =>
                      handleInputChange("shipping", "firstName", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.firstName"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors["shipping.firstName"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.firstName"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.lastName}
                    onChange={(e) =>
                      handleInputChange("shipping", "lastName", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.lastName"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors["shipping.lastName"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.lastName"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) =>
                      handleInputChange("shipping", "email", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.email"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors["shipping.email"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.email"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) =>
                      handleInputChange("shipping", "phone", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.phone"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors["shipping.phone"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.phone"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={shippingInfo.address}
                  onChange={(e) =>
                    handleInputChange("shipping", "address", e.target.value)
                  }
                  className={`w-full p-3 border rounded-md ${
                    errors["shipping.address"]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {errors["shipping.address"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors["shipping.address"]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) =>
                      handleInputChange("shipping", "city", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.city"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors["shipping.city"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.city"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <select
                    value={shippingInfo.district}
                    onChange={(e) =>
                      handleInputChange("shipping", "district", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.district"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {errors["shipping.district"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.district"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.postalCode}
                    onChange={(e) =>
                      handleInputChange(
                        "shipping",
                        "postalCode",
                        e.target.value
                      )
                    }
                    className={`w-full p-3 border rounded-md ${
                      errors["shipping.postalCode"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors["shipping.postalCode"] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors["shipping.postalCode"]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Billing Information</h2>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Same as shipping</span>
                </label>
              </div>

              {!sameAsShipping && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={billingInfo.firstName}
                        onChange={(e) =>
                          handleInputChange(
                            "billing",
                            "firstName",
                            e.target.value
                          )
                        }
                        className={`w-full p-3 border rounded-md ${
                          errors["billing.firstName"]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {errors["billing.firstName"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["billing.firstName"]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={billingInfo.lastName}
                        onChange={(e) =>
                          handleInputChange(
                            "billing",
                            "lastName",
                            e.target.value
                          )
                        }
                        className={`w-full p-3 border rounded-md ${
                          errors["billing.lastName"]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {errors["billing.lastName"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors["billing.lastName"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Additional billing fields would go here */}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio"
                  />
                  <span>Credit/Debit Card</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio"
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {submitting
                ? "Processing..."
                : `Place Order - $${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.image || "/placeholder-product.png"}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
