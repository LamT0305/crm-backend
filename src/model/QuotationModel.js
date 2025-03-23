import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema({
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", required: true },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const QuotationModel = mongoose.model("Quotation", QuotationSchema);
export default QuotationModel;
