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
    const { authUser, socket } = get();
    if (!authUser) return;
    if (socket?.connected) return;

    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    set({ socket: newSocket });

    const pingInterval = setInterval(async () => {
      try {
        await AxiosInstance.patch("/users/last-seen");
      } catch (error) {
        console.log("error in pingInterval:", error);
      }
    }, 60000);

    newSocket.on("disconnect", () => {
      clearInterval(pingInterval);
    });

    return () => {
      clearInterval(pingInterval);
    };
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

export default useAuthStore;
