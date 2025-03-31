import mongoose from "mongoose";

const DealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductService",
        required: true,
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    },
  ],
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" }, // Linked quotation
  status: {
    type: String,
    enum: ["Open", "Negotiation", "Won", "Lost"],
    default: "Open",
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
},{
  timestamps: true,
});

const DealModel = mongoose.model("Deal", DealSchema);
export default DealModel;
