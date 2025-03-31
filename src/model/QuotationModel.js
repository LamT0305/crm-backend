import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema({
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", required: true },
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
  totalPrice: Number,
  discount: {
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  finalPrice: {
    type: Number,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const QuotationModel = mongoose.model("Quotation", QuotationSchema);
export default QuotationModel;
