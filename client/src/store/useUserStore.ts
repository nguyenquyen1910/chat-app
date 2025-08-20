import { create } from "zustand";
import { AxiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
  createdAt: string;
}

interface UserStore {
  authUser: AuthUser | null;
  isUpdatingProfile: boolean;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

interface UpdateProfileData {
  profilePic: string;
}

export const useUserStore = create<UserStore>((set) => ({
  authUser: null,
  isUpdatingProfile: false,

  updateProfile: async (data: UpdateProfileData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await AxiosInstance.put("/users/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      const errMsg =
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Something went wrong";
      toast.error(errMsg);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
}));
