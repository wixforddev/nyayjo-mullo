import mongoose from "mongoose";
import { paginate } from "./plugins";
import { PaginateResult } from "./plugins/paginate.plugin";

interface BazarDocument extends mongoose.Document {
  name: string;
  nameBn: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  isActive: boolean;
}

interface BazarModel extends mongoose.Model<BazarDocument> {
  paginate(filter: any, options: any): Promise<PaginateResult<BazarDocument>>;
}

const bazarSchema = new mongoose.Schema<BazarDocument, BazarModel>(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    nameBn: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      default: "Dhaka",
      trim: true,
    },
    lat: {
      type: Number,
      default: 23.8103,
    },
    lng: {
      type: Number,
      default: 90.4125,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

bazarSchema.plugin(paginate);

const Bazar = mongoose.model<BazarDocument, BazarModel>("Bazar", bazarSchema);

export default Bazar;
export { BazarDocument };
