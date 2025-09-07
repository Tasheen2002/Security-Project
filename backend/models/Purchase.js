import mongoose from "mongoose";

const allowedTimes = ["10 AM", "11 AM", "12 PM"];
const allowedDistricts = [
  "Colombo",
  "Gampaha",
  "Kandy",
  "Galle",
  "Matara",
  "Kurunegala",
  "Jaffna",
  "Badulla",
  "Anuradhapura",
  "Ratnapura",
];
const allowedProducts = [
  "Laptop",
  "Smartphone",
  "Tablet",
  "Headphones",
  "Camera",
  "Smartwatch",
  "Printer",
  "Monitor",
  "Keyboard",
  "Mouse",
];

const purchaseSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: { type: String, required: true },
  date: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const today = new Date();
        const d = new Date(value);
        if (d < today.setHours(0, 0, 0, 0)) return false; // must not be past
        if (d.getDay() === 0) return false; // not Sunday
        return true;
      },
      message: "Invalid delivery date",
    },
  },
  deliveryTime: {
    type: String,
    enum: allowedTimes,
    required: true,
  },
  deliveryLocation: {
    type: String,
    enum: allowedDistricts,
    required: true,
  },
  productName: {
    type: String,
    enum: allowedProducts,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  message: {
    type: String,
    default: "",
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Purchase", purchaseSchema);
