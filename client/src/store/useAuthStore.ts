import { create } from "zustand";
import { AxiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
  createdAt: string;
}

interface AuthStore {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const useAuthStore = create<AuthStore>((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await AxiosInstance.get("/auth/check");
      set({ authUser: res.data.user });
    } catch (error) {
      console.log(error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data: SignupData) => {
    try {
      set({ isSigningUp: true });
      const res = await AxiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Signup successful");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: LoginData) => {
    try {
      set({ isLoggingIn: true });
      const res = await AxiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Login successful");
    } catch (error) {
      console.log(error);
      toast.error("Invalid credentials");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await AxiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  },
}));

export default useAuthStore;
