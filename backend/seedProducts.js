import mongoose from "mongoose";
import Product from "./models/Product.js";
import { config } from "./config/env.js";

const products = [
  {
    name: "Laptop",
    description: "High-performance laptop for work and gaming",
    price: 999.99,
    stock: 50,
  },
  {
    name: "Smartphone",
    description: "Latest model smartphone with advanced features",
    price: 699.99,
    stock: 100,
  },
  {
    name: "Headphones",
    description: "Premium wireless headphones with noise cancellation",
    price: 299.99,
    stock: 75,
  },
  {
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with health monitoring",
    price: 399.99,
    stock: 60,
  },
  {
    name: "Tablet",
    description: "Lightweight tablet perfect for media and productivity",
    price: 499.99,
    stock: 40,
  },
  {
    name: "Camera",
    description: "Professional DSLR camera for photography enthusiasts",
    price: 1299.99,
    stock: 25,
  },
  {
    name: "Gaming Console",
    description: "Next-gen gaming console with 4K gaming support",
    price: 499.99,
    stock: 30,
  },
  {
    name: "Keyboard",
    description: "Mechanical gaming keyboard with RGB lighting",
    price: 149.99,
    stock: 80,
  },
  {
    name: "Mouse",
    description: "High-precision gaming mouse with customizable buttons",
    price: 79.99,
    stock: 90,
  },
  {
    name: "Monitor",
    description: "27-inch 4K monitor with HDR support",
    price: 599.99,
    stock: 35,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert new products
    await Product.insertMany(products);
    console.log("Products seeded successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
}

// Only run the seeder automatically in development to avoid accidental data loss.
// For manual seeding in any environment, run: npm run seed:products
if (process.env.NODE_ENV === "development") {
  seedProducts();
} else {
  console.log(
    "Skipping product seeding. To seed products manually run `npm run seed:products` or set NODE_ENV=development"
  );
}
