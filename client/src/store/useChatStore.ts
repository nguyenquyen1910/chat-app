import { create } from "zustand";
import { AxiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
  createdAt: string;
}
interface ChatStore {
  messages: MessageData[];
  users: UserData[];
  selectedUser: UserData | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  setSelectedUser: (user: UserData) => void;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: MessageData) => Promise<void>;
}

interface MessageData {
  message: string;
  image: string;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  setSelectedUser: (user: UserData) => set({ selectedUser: user }),
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await AxiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.log("error in update profile:", error);
      const errMsg =
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Something went wrong";
      toast.error(errMsg);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await AxiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      console.log("error in update profile:", error);
      const errMsg =
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Something went wrong";
      toast.error(errMsg);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: MessageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await AxiosInstance.post(
        `/messages/send/${selectedUser?._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.log("error in update profile:", error);
      const errMsg =
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Something went wrong";
      toast.error(errMsg);
    }
  },
}));
