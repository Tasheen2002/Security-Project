import React from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const { totalItems } = useCart();

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg">
      <Link
        to="/"
        className="font-bold text-xl hover:text-blue-200 transition-colors"
      >
        🛒 Secure E-Commerce
      </Link>

      <div className="flex gap-4 items-center">
        <Link
          to="/"
          className="hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700"
        >
          Home
        </Link>

        {isAuthenticated ? (
          <>
            <Link
              to="/profile"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700"
            >
              Profile
            </Link>

            <Link
              to="/cart"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700 relative"
            >
              🛒 Cart
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              to="/purchases"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700"
            >
              My Orders
            </Link>

            {/* Show admin link based on server-side validation, not client-side role */}
            <Link
              to="/admin"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Admin Panel
            </Link>

            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-blue-500">
              {user?.picture && (
                <img
                  src={user.picture}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-blue-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
              <span className="text-sm text-blue-100">
                {user?.name ||
                  user?.nickname ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </span>
            </div>
          </>
        ) : (
          <button
            onClick={loginWithRedirect}
            className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded transition-colors font-medium"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
