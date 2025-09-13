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

interface PublicUser {
  _id: string;
  fullName: string;
  profilePic: string;
  email: string;
  createdAt: string;
  isOnline?: boolean;
}

interface UserStore {
  authUser: AuthUser | null;
  publicUser: PublicUser | null;
  isUpdatingProfile: boolean;
  isGettingProfile: boolean;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  getProfile: (userId: string) => Promise<void>;
  getPublicUser: (userId: string) => Promise<PublicUser | null>;
}

interface UpdateProfileData {
  profilePic: string;
}

export const useUserStore = create<UserStore>((set) => ({
  authUser: null,
  publicUser: null,
  isUpdatingProfile: false,
  isGettingProfile: false,
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

  getProfile: async (userId: string) => {
    set({ isGettingProfile: true });
    try {
      const res = await AxiosInstance.get(`/users/${userId}`);
      set({ publicUser: res.data });
    } catch (error) {
      console.log("error in getProfile:", error);
      toast.error("Something went wrong");
    } finally {
      set({ isGettingProfile: false });
    }
  },
  getPublicUser: async (userId: string) => {
    try {
      const res = await AxiosInstance.get(`/users/${userId}`);
      const user = res.data as PublicUser;
      set({ publicUser: user });
      return user;
    } catch (error) {
      console.log("error in getPublicUser:", error);
      const errMsg =
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Something went wrong";
      toast.error(errMsg);
      return null;
    }
  },
}));
