// Home.jsx
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import ProductList from "../components/ProductList";

export default function Home() {
  const { isAuthenticated, user } = useAuth0();
  return (
    <div>
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Secure E-Commerce</h1>
        <p className="text-lg mb-6">
          Shop securely and manage your purchases with confidence.
        </p>
        {isAuthenticated ? (
          <div className="bg-green-100 text-green-800 p-4 rounded shadow inline-block">
            <p className="font-semibold">
              Logged in as: {user?.name || user?.nickname || user?.email}
            </p>
          </div>
        ) : (
          <div className="bg-blue-100 text-blue-800 p-4 rounded shadow inline-block">
            <p className="font-semibold">
              Please log in to access your profile and purchases.
            </p>
          </div>
        )}
      </div>
      <ProductList />
    </div>
  );
}
