// Quick test to see what kind of token Auth0 generates
// This will help us understand the token format

const fetch = require("node-fetch");

// Test the products endpoint (should work without auth)
async function testProducts() {
  try {
    const response = await fetch("http://localhost:4000/api/products");
    const data = await response.json();
    console.log(
      "✅ Products endpoint:",
      response.status,
      data.length ? `${data.length} products` : "no products"
    );
  } catch (error) {
    console.error("❌ Products endpoint error:", error.message);
  }
}

// Test the purchases endpoint (should fail without auth)
async function testPurchasesNoAuth() {
  try {
    const response = await fetch("http://localhost:4000/api/purchases/mine");
    const data = await response.json();
    console.log("❌ Purchases endpoint (no auth):", response.status, data);
  } catch (error) {
    console.error("❌ Purchases endpoint error:", error.message);
  }
}

// Test with fake token to see middleware response
async function testPurchasesFakeAuth() {
  try {
    const response = await fetch("http://localhost:4000/api/purchases/mine", {
      headers: {
        Authorization: "Bearer fake-token-12345",
      },
    });
    const data = await response.json();
    console.log("❌ Purchases endpoint (fake auth):", response.status, data);
  } catch (error) {
    console.error("❌ Purchases endpoint error:", error.message);
  }
}

console.log("🧪 Testing API endpoints...\n");

testProducts()
  .then(() => testPurchasesNoAuth())
  .then(() => testPurchasesFakeAuth())
  .then(() => console.log("\n✅ Tests completed"));
