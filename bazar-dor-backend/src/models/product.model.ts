import mongoose from "mongoose";
import { paginate } from "./plugins";
import { PaginateResult } from "./plugins/paginate.plugin";

interface ProductDocument extends mongoose.Document {
  name: string;
  nameBn: string;
  unit: string;
  icon: string;
  image: string;
  category: "vegetable" | "fish" | "meat" | "dairy" | "grain" | "oil" | "spice" | "pulse" | "other"
  defaultPrice: number;
  isActive: boolean;
}

interface ProductModel extends mongoose.Model<ProductDocument> {
  paginate(filter: any, options: any): Promise<PaginateResult<ProductDocument>>;
}

const productSchema = new mongoose.Schema<ProductDocument, ProductModel>(
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
    unit: {
      type: String,
      required: [true, "Unit is required"],
      default: "kg",
    },
    icon: {
      type: String,
      default: "🛒",
    },
    image: {
      type: String,
      default: '',
    },
  category: {
  type: String,
  enum: [
    "vegetable","fish","meat","dairy","grain",
    "pulse","oil","spice","fruit","bakery","protein",
    "beverage","frozen","dry_food","other"
  ],
  required: true
},
    defaultPrice: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

productSchema.plugin(paginate);

const Product = mongoose.model<ProductDocument, ProductModel>("Product", productSchema);

export default Product;
export { ProductDocument };
