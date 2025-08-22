import { create } from "zustand";
import { AxiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import useAuthStore from "./useAuthStore";
import { persist } from "zustand/middleware";

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
  createdAt: string;
}

interface MessageData {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  image: string | null;
  createdAt: string;
  updatedAt?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  isRead?: boolean;
  readAt?: string;
}

interface NewMessagePayload {
  message: string;
  image: string | null;
}
interface ChatStore {
  messages: MessageData[];
  users: UserData[];
  selectedUser: UserData | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  typingUsers: string[];
  setSelectedUser: (user: UserData | null) => void;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: NewMessagePayload) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  subcribeToMessage: () => void;
  unsubcribeFromMessage: () => void;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      users: [],
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false,
      typingUsers: [],

      setSelectedUser: (user: UserData | null) => {
        const { socket } = useAuthStore.getState();

        // Leave previous room
        if (get().selectedUser) {
          socket?.emit("leave_room", get().selectedUser?._id);
        }

        // Join new room
        if (user) {
          socket?.emit("join_room", user._id);
        }

        set({ selectedUser: user, typingUsers: [] });
      },

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await AxiosInstance.get("/messages/users");
          set({ users: res.data });
        } catch (error) {
          console.log("error in update profile:", error);
          const errMsg =
            (error as AxiosError<{ message: string }>)?.response?.data
              ?.message || "Something went wrong";
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
            (error as AxiosError<{ message: string }>)?.response?.data
              ?.message || "Something went wrong";
          toast.error(errMsg);
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (payload: NewMessagePayload) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return;

        try {
          const res = await AxiosInstance.post(
            `/messages/send/${selectedUser._id}`,
            payload
          );
          set({ messages: [...messages, res.data as MessageData] });
        } catch (error) {
          console.log("error in sendMessage:", error);
          const errMsg =
            (error as AxiosError<{ message: string }>)?.response?.data
              ?.message || "Something went wrong";
          toast.error(errMsg);
        }
      },

      markMessageAsRead: async (messageId: string) => {
        try {
          await AxiosInstance.patch(`/messages/${messageId}/read`);
        } catch (error) {
          console.log("error in update profile:", error);
        }
      },

      subcribeToMessage: () => {
        const { selectedUser } = get();
        const { socket } = useAuthStore.getState();
        if (!selectedUser || !socket) return;

        socket.off("newMessage");
        socket.off("user_typing");
        socket.off("message_read");

        socket.on("newMessage", (newMessage: MessageData) => {
          console.log("Received new message:", newMessage);
          const me = useAuthStore.getState().authUser?._id;
          const isForThisThread =
            (newMessage.senderId === selectedUser._id &&
              newMessage.receiverId === me) ||
            (newMessage.senderId === me &&
              newMessage.receiverId === selectedUser._id);

          if (!isForThisThread) return;

          set((state) => ({
            messages: [...state.messages, newMessage],
          }));

          // Auto mark as read if user is in the chat
          if (newMessage.senderId === selectedUser._id) {
            get().markMessageAsRead(newMessage._id);
          }
        });

        // Listen for typing events
        socket.on("user_typing", (data) => {
          console.log("Typing event:", data);
          if (data.roomId === selectedUser._id) {
            set((state) => ({
              typingUsers: data.isTyping
                ? [
                    ...state.typingUsers.filter((id) => id !== data.userId),
                    data.userId,
                  ]
                : state.typingUsers.filter((id) => id !== data.userId),
            }));
          }
        });

        // Listen for read status
        socket.on("message_read", (data) => {
          console.log("Message read event:", data);
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg._id === data.messageId
                ? { ...msg, isRead: true, readAt: data.readAt }
                : msg
            ),
          }));
        });
      },

      unsubcribeFromMessage: () => {
        const { socket } = useAuthStore.getState();
        if (socket) {
          socket.off("newMessage");
          socket.off("user_typing");
          socket.off("message_read");
        }
      },

      sendTypingStart: () => {
        const { selectedUser } = get();
        const { socket } = useAuthStore.getState();

        if (selectedUser && socket) {
          console.log("Sending typing start");
          socket.emit("typing_start", {
            roomId: selectedUser._id,
            userId: useAuthStore.getState().authUser?._id,
          });
        }
      },

      sendTypingStop: () => {
        const { selectedUser } = get();
        const { socket } = useAuthStore.getState();

        if (selectedUser && socket) {
          console.log("Sending typing stop");
          socket.emit("typing_stop", {
            roomId: selectedUser._id,
            userId: useAuthStore.getState().authUser?._id,
          });
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        selectedUser: state.selectedUser,
      }),
    }
  )
);
