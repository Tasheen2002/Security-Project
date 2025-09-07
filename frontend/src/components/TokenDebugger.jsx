import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const TokenDebugger = () => {
  const {
    isAuthenticated,
    getAccessTokenSilently,
    user,
    loginWithRedirect,
    logout,
  } = useAuth0();
  const [tokenInfo, setTokenInfo] = React.useState(null);

  const analyzeToken = async () => {
    if (!isAuthenticated) {
      console.log("User not authenticated");
      return;
    }

    try {
      // Get default token (no audience since API doesn't exist in Auth0)
      console.log("🔍 Getting default token...");
      const token1 = await getAccessTokenSilently();

      // Try with specific scopes
      console.log("🔍 Getting token with explicit scopes...");
      const token2 = await getAccessTokenSilently({
        authorizationParams: {
          scope: "openid profile email",
        },
      });

      const analyzeTokenPayload = (token, label) => {
        if (!token) return { error: "No token received" };

        try {
          const parts = token.split(".");
          if (parts.length !== 3)
            return {
              error:
                "JWE (encrypted) token - cannot decode without private key",
              tokenType: "JWE",
              parts: parts.length,
            };

          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));

          return {
            tokenType: "JWT",
            header,
            payload,
            tokenLength: token.length,
            issuedAt: new Date(payload.iat * 1000),
            expiresAt: new Date(payload.exp * 1000),
          };
        } catch (e) {
          return { error: e.message };
        }
      };

      const analysis = {
        token1: {
          label: "Default token",
          raw: token1?.substring(0, 50) + "...",
          analysis: analyzeTokenPayload(token1, "Default"),
        },
        token2: {
          label: "Token with explicit scopes",
          raw: token2?.substring(0, 50) + "...",
          analysis: analyzeTokenPayload(token2, "With scopes"),
        },
      };

      setTokenInfo(analysis);
      console.log("🎯 Token Analysis:", analysis);
    } catch (error) {
      console.error("❌ Error getting token:", error);
      setTokenInfo({ error: error.message });
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        <h2>🔐 Auth0 Token Debugger</h2>
        <p>Please log in to analyze your tokens:</p>
        <button
          onClick={loginWithRedirect}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          🚀 Log In
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "20px", fontFamily: "monospace", maxWidth: "800px" }}
    >
      <h2>🔐 Auth0 Token Debugger</h2>

      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <h3>👤 User Info:</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={analyzeToken}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            marginRight: "10px",
          }}
        >
          🔍 Analyze Tokens
        </button>
        <button
          onClick={logout}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          🚪 Logout
        </button>
      </div>

      {tokenInfo && (
        <div>
          <h3>🎯 Token Analysis:</h3>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TokenDebugger;
