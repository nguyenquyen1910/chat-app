import { create } from "zustand";
import { AxiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

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
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
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

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await AxiosInstance.get("/auth/check");
      set({ authUser: res.data.user });
      useChatStore.getState().setSelectedUser(res.data.user);
      get().connectSocket();
    } catch (error) {
      console.log(error);
      set({ authUser: null });
      useChatStore.getState().resetChatStore();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data: SignupData) => {
    try {
      set({ isSigningUp: true });
      const res = await AxiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      useChatStore.getState().resetChatStore();
      toast.success("Signup successful");
      get().connectSocket();
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
      useChatStore.getState().resetChatStore();
      toast.success("Login successful");
      get().connectSocket();
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
      get().disconnectSocket();
      set({ authUser: null });
      useChatStore.getState().resetChatStore();
      toast.success("Logged out successfully");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));

export default useAuthStore;
