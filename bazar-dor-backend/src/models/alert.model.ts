import mongoose from "mongoose";
import { paginate } from "./plugins";
import { PaginateResult } from "./plugins/paginate.plugin";

interface AlertDocument extends mongoose.Document {
  type: "price_spike" | "stock_out" | "market_closed" | "general";
  message: string;
  messageBn: string;
  productId: mongoose.Types.ObjectId | null;
  bazarId: mongoose.Types.ObjectId | null;
  severity: "low" | "medium" | "high" | "critical";
  isActive: boolean;
  expiresAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

interface AlertModel extends mongoose.Model<AlertDocument> {
  paginate(filter: any, options: any): Promise<PaginateResult<AlertDocument>>;
}

const alertSchema = new mongoose.Schema<AlertDocument, AlertModel>(
  {
    type: {
      type: String,
      enum: ["price_spike", "stock_out", "market_closed", "general"],
      required: false,
      default: "general",
    },
    message: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    messageBn: {
      type: String,
      default: "",
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    bazarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bazar",
      default: null,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

alertSchema.plugin(paginate);

const Alert = mongoose.model<AlertDocument, AlertModel>("Alert", alertSchema);

export default Alert;
export { AlertDocument };
