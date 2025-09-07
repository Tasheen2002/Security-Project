import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiRequest } from "../utils/api";
import { validatePurchaseForm, sanitizeInput } from "../utils/validation";

const DELIVERY_TIMES = ["10 AM", "11 AM", "12 PM"];
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
const PRODUCTS = [
  "Laptop",
  "Smartphone",
  "Headphones",
  "Smart Watch",
  "Tablet",
  "Camera",
  "Gaming Console",
  "Keyboard",
  "Mouse",
  "Monitor",
];

export default function PurchaseForm({ onSuccess }) {
  const { user, getAccessTokenSilently } = useAuth0();
  const [formData, setFormData] = useState({
    date: "",
    deliveryTime: "",
    deliveryLocation: "",
    productName: "",
    quantity: 1,
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const validation = validatePurchaseForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getAccessTokenSilently();
      const purchaseData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        // username will be set by backend using Auth0 user ID
      };

      await apiRequest("/api/purchases", "POST", purchaseData, token);

      setFormData({
        date: "",
        deliveryTime: "",
        deliveryLocation: "",
        productName: "",
        quantity: 1,
        message: "",
      });
      setErrors({});

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Purchase submission error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });

      let errorMessage = "Failed to submit purchase. Please try again.";

      if (error.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.status === 403) {
        errorMessage = "Access denied. Please check your permissions.";
      } else if (error.status === 400) {
        errorMessage =
          error.message || "Invalid data submitted. Please check your form.";
      } else if (error.message.includes("Network error")) {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running.";
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="bg-white shadow rounded p-6 max-w-lg mx-auto mt-8"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold mb-4">Purchase Product</h2>

      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Delivery Date *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          min={getTodayDate()}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.date ? "border-red-500" : "border-gray-300"
          }`}
          required
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="deliveryTime"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Delivery Time *
        </label>
        <select
          id="deliveryTime"
          name="deliveryTime"
          value={formData.deliveryTime}
          onChange={handleInputChange}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.deliveryTime ? "border-red-500" : "border-gray-300"
          }`}
          required
        >
          <option value="">Select delivery time</option>
          {DELIVERY_TIMES.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        {errors.deliveryTime && (
          <p className="text-red-500 text-sm mt-1">{errors.deliveryTime}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="deliveryLocation"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Delivery Location *
        </label>
        <select
          id="deliveryLocation"
          name="deliveryLocation"
          value={formData.deliveryLocation}
          onChange={handleInputChange}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.deliveryLocation ? "border-red-500" : "border-gray-300"
          }`}
          required
        >
          <option value="">Select district</option>
          {DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
        {errors.deliveryLocation && (
          <p className="text-red-500 text-sm mt-1">{errors.deliveryLocation}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="productName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Product *
        </label>
        <select
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.productName ? "border-red-500" : "border-gray-300"
          }`}
          required
        >
          <option value="">Select product</option>
          {PRODUCTS.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
        {errors.productName && (
          <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="quantity"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Quantity *
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleInputChange}
          min="1"
          max="100"
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.quantity ? "border-red-500" : "border-gray-300"
          }`}
          required
        />
        {errors.quantity && (
          <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Message (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          maxLength="500"
          rows="3"
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.message ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Any special instructions..."
        />
        {errors.message && (
          <p className="text-red-500 text-sm mt-1">{errors.message}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">
          {formData.message.length}/500 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isSubmitting ? "Submitting..." : "Submit Purchase"}
      </button>
    </form>
  );
}
