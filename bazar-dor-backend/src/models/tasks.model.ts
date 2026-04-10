import mongoose from "mongoose";
import { paginate } from "./plugins";
import { PaginateResult } from "./plugins/paginate.plugin";

interface CrewDocument extends mongoose.Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  taskLink: string;
  status: "accepted" | "rejected" | "pending";
}

interface CrewModel extends mongoose.Model<CrewDocument> {
  paginate(filter: any, options: any): Promise<PaginateResult<CrewDocument>>;
}

const crewSchema = new mongoose.Schema<CrewDocument, CrewModel>(
  {
    name: {
      type: String,
      required: [true, "Name is must be Required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: false,
    },
    taskLink: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
      enum: ["accepted", "rejected", "pending"],
      default: "pending",
    },
  },
  { timestamps: true },
);

crewSchema.plugin(paginate);

const Crew = mongoose.model<CrewDocument, CrewModel>("Crew", crewSchema);

export default Crew;
export { CrewDocument };
