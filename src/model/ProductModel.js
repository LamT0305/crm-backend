import mongoose from "mongoose";

const ProductServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductServiceModel = mongoose.model(
  "ProductService",
  ProductServiceSchema
);
export default ProductServiceModel;
