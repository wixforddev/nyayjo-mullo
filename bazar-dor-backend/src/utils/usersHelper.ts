import mongoose from "mongoose";
import User from "../models/user.model";

interface UserDoc extends mongoose.Document {
  status: string;
}

interface UserHelper {
  setUserOnline: (id: string) => Promise<UserDoc | null>;
  setUserOffline: (id: string) => Promise<UserDoc | null>;
}

const user: UserHelper = {
  setUserOnline: async function (id: string): Promise<UserDoc | null> {
    return await User.findByIdAndUpdate(
      id,
      { status: "online" },
      { new: true },
    );
  },

  setUserOffline: async function (id: string): Promise<UserDoc | null> {
    return await User.findByIdAndUpdate(
      id,
      { status: "offline" },
      { new: true },
    );
  },
};

export default user;
