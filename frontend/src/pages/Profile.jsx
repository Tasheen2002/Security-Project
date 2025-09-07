// Profile.jsx
import { useAuth0 } from "@auth0/auth0-react";
import Profile from "../components/Profile";
import React from "react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-blue-600">
          Please log in to view your profile information.
        </p>
      </div>
    );
  }

  return <Profile user={user} />;
}
