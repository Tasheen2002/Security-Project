// SignupButton.jsx
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function SignupButton() {
  const { loginWithRedirect } = useAuth0();
  return (
    <button
      onClick={() => loginWithRedirect({ screen_hint: "signup" })}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Sign Up
    </button>
  );
}
