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
      },
      quantity: Number,
      price: Number,
    },
  ],
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" }, // Linked quotation
  status: {
    type: String,
    enum: ["Open", "Negotiation", "Won", "Lost"],
    default: "Open",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DealModel = mongoose.model("Deal", DealSchema);
export default DealModel;
