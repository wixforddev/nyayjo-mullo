import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import validator from "validator";
import { roles } from "../config/roles";
import { paginate, toJSON } from "./plugins";
import { PaginateResult } from "./plugins/paginate.plugin";

interface UserDocument extends mongoose.Document {
  fullName: string;
  email: string;
  image: { url: string; path: string };
  password: string;
  role: string;
  rand: number;
  dataOfBirth: string;
  interest: any[];
  address: string;
  oneTimeCode: string;
  isEmailVerified: boolean;
  isResetPassword: boolean;
  isInterest: boolean;
  isProfileCompleted: boolean;
  isDeleted: boolean;
  isPasswordMatch(password: string): Promise<boolean>;
}

interface UserModel extends mongoose.Model<UserDocument> {
  isEmailTaken(
    email: string,
    excludeUserId: mongoose.Types.ObjectId,
  ): Promise<boolean>;
  isPhoneNumberTaken(
    phoneNumber: string,
    excludeUserId: mongoose.Types.ObjectId,
  ): Promise<boolean>;
  paginate(filter: any, options: any): Promise<PaginateResult<UserDocument>>;
}

const userSchema: any = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    image: {
      type: Object,
      required: [true, "Image is must be Required"],
      default: { url: `/uploads/users/user.png`, path: "null" },
    },
    password: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number",
          );
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
    },
    rand: {
      type: Number,
      required: false,
      default: 0,
    },
    dataOfBirth: {
      type: String,
      required: false,
    },
    interest: {
      type: Array,
      required: false,
      default: [],
    },
    address: {
      type: String,
      required: false,
    },
    oneTimeCode: {
      type: String,
      required: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    isInterest: {
      type: Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId: mongoose.Types.ObjectId,
): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isPhoneNumberTaken = async function (
  phoneNumber: string,
  excludeUserId: mongoose.Types.ObjectId,
): Promise<boolean> {
  const user = await this.findOne({ phoneNumber, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (
  password: string,
): Promise<boolean> {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this as any;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
export { UserDocument, UserModel };
