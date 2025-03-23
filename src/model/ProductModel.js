import mongoose from "mongoose";

const ProductServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: {
    type: String,
    enum: ["pt-training", "annual-training", "supplement", "stretching"],
  },
  stock: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    required: true,
  },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ProductServiceModel = mongoose.model(
  "ProductService",
  ProductServiceSchema
);
export default ProductServiceModel;
