#!/usr/bin/env node

// Test script to verify system status
const http = require("http");

async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const duration = Date.now() - startTime;
        console.log(`✅ ${description}: ${res.statusCode} (${duration}ms)`);
        if (res.statusCode !== 200) {
          console.log(`   Response: ${data.substring(0, 200)}...`);
        }
        resolve({
          success: res.statusCode === 200,
          status: res.statusCode,
          data,
        });
      });
    });

    req.on("error", (err) => {
      const duration = Date.now() - startTime;
      console.log(`❌ ${description}: ERROR (${duration}ms) - ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏰ ${description}: TIMEOUT`);
      resolve({ success: false, error: "Timeout" });
    });
  });
}

async function runTests() {
  console.log("🔍 System Health Check\n");

  const tests = [
    {
      url: "http://localhost:4000/api/products",
      desc: "Backend API - Products",
    },
    { url: "http://localhost:3000", desc: "Frontend React App" },
  ];

  for (const test of tests) {
    await testEndpoint(test.url, test.desc);
  }

  console.log("\n📊 Test completed");
}

runTests().catch(console.error);
