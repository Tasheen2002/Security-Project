// utils/api.js
// Secure API utility for backend communication

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(
  endpoint,
  method = "GET",
  body = null,
  token = null,
  useCredentials = true
) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF protection
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestOptions = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  // Only include credentials for authenticated endpoints
  if (useCredentials) {
    requestOptions.credentials = "include";
  }

  try {
    const response = await fetch(url, requestOptions);

    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorMessage = "An error occurred";
      let errorData = null;

      if (contentType && contentType.includes("application/json")) {
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
      } else {
        try {
          const textError = await response.text();
          // Don't expose raw error details to prevent information disclosure
          errorMessage =
            response.status === 401
              ? "Authentication required"
              : response.status === 403
              ? "Access denied"
              : response.status === 404
              ? "Resource not found"
              : response.status >= 500
              ? "Server error. Please try again."
              : "Request failed";
        } catch (textError) {
          errorMessage = response.statusText || errorMessage;
        }
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new ApiError(
        "Network error. Please check your connection.",
        0,
        null
      );
    }

    // Handle timeout or other errors
    throw new ApiError("Request failed. Please try again.", 0, null);
  }
}

export { ApiError };
