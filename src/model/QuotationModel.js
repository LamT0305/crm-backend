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
      price: Number, // Store price at the time of quotation
    },
  ],
  totalPrice: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const QuotationModel = mongoose.model("Quotation", QuotationSchema);
export default QuotationModel;
