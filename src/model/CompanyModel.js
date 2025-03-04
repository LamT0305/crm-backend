import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: String,
  industry: String,
  website: String,
  territoty: String,
  numberOfEmployees: Number,
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: "Source" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const CompanyModel = mongoose.model("Company", CompanySchema);
export default CompanyModel;
