import mongoose from "mongoose";
const { Schema } = mongoose;

interface IService {
  name: string;
  price: number;
}

interface ICategory {
  id: string;
  name: string;
  service: IService[];
}

interface IServiceDocument extends mongoose.Document {
  id: string;
  name: string;
  description: string[];
  Categories: ICategory[];
}

const serviceSchema = new Schema<IService>({
  name: String,
  price: Number,
});

const categorySchema = new Schema<ICategory>({
  id: String,
  name: String,
  service: [serviceSchema],
});

const mainSchema = new Schema<IServiceDocument>({
  id: String,
  name: String,
  description: [String],
  Categories: [categorySchema],
});

const Service = mongoose.model<IServiceDocument>("Service", mainSchema);

export default Service;
export { IServiceDocument };
