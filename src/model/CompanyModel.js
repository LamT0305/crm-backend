import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  name: String,
  industry: String,
  website: String,
  territoty: String,
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: "Source" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const CompanyModel = mongoose.model("Company", CompanySchema);
export default CompanyModel;
