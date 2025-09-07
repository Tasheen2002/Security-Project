import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiRequest } from "../utils/api";

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_CART":
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        totalItems: action.payload.totalItems || 0,
        loading: false,
        error: null,
      };
    case "ADD_ITEM":
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        totalItems: action.payload.totalItems || 0,
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        totalItems: action.payload.totalItems || 0,
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        totalItems: action.payload.totalItems || 0,
      };
    case "CLEAR_CART":
      return {
        ...state,
        items: [],
        total: 0,
        totalItems: 0,
      };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  total: 0,
  totalItems: 0,
  loading: false,
  error: null,
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  // Fetch cart when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      dispatch({ type: "CLEAR_CART" });
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest("/api/cart", "GET", null, token);
      dispatch({ type: "SET_CART", payload: response });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load cart" });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please log in to add items to cart",
      });
      return false;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest(
        "/api/cart",
        "POST",
        { productId, quantity },
        token
      );

      if (response.success) {
        dispatch({ type: "ADD_ITEM", payload: response.cart });
        return true;
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: response.message || "Failed to add item",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to add item to cart" });
      return false;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    if (!isAuthenticated) return false;

    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest(
        `/api/cart/${itemId}`,
        "PUT",
        { quantity },
        token
      );

      if (response.success) {
        dispatch({ type: "UPDATE_ITEM", payload: response.cart });
        return true;
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: response.message || "Failed to update item",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to update cart item:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to update item" });
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return false;

    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest(
        `/api/cart/${itemId}`,
        "DELETE",
        null,
        token
      );

      if (response.success) {
        dispatch({ type: "REMOVE_ITEM", payload: response.cart });
        return true;
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: response.message || "Failed to remove item",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to remove item" });
      return false;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return false;

    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest("/api/cart/clear", "POST", null, token);

      if (response.success) {
        dispatch({ type: "CLEAR_CART" });
        return true;
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: response.message || "Failed to clear cart",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to clear cart" });
      return false;
    }
  };

  const clearError = () => {
    dispatch({ type: "SET_ERROR", payload: null });
  };

  const value = {
    ...state,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    clearError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
