import { create } from "zustand";
import { AxiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import useAuthStore from "./useAuthStore";
import { persist } from "zustand/middleware";

/**
 * Interface cho thông tin user
 */
interface UserData {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
  createdAt: string;
}

/**
 * Interface cho thông tin tin nhắn
 */
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

/**
 * Interface cho payload gửi tin nhắn mới
 */
interface NewMessagePayload {
  message: string;
  image: string | null;
}

/**
 * Interface chính cho Chat Store
 */
interface ChatStore {
  // State
  messages: MessageData[];
  users: UserData[];
  selectedUser: UserData | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  typingUsers: string[];
  lastMessageByUserId: Record<
    string,
    { text: string; createdAt: string; isFromMe: boolean }
  >;
  unreadCountByUserId: Record<string, number>;

  // Actions
  setSelectedUser: (user: UserData | null) => void;
  getUsers: () => Promise<void>;
  getSortedUsers: () => UserData[];
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: NewMessagePayload) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessageAsRead: (userId: string) => Promise<void>;
  subcribeToMessage: () => void;
  unsubcribeFromMessage: () => void;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  loadLastMessages: () => Promise<void>;
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
      lastMessageByUserId: {},
      unreadCountByUserId: {},

      /**
       * Chọn user để chat và join/leave socket room
       * @param user - User được chọn hoặc null để bỏ chọn
       */
      setSelectedUser: (user: UserData | null) => {
        const { socket } = useAuthStore.getState();

        // Leave previous room
        if (get().selectedUser) {
          socket?.emit("leave_room", get().selectedUser?._id);
        }

        // Join new room
        if (user) {
          socket?.emit("join_room", user._id);
          get().markAllMessageAsRead(user._id);
        }

        set({
          selectedUser: user,
          typingUsers: [],
          unreadCountByUserId: user
            ? { ...get().unreadCountByUserId, [user._id]: 0 }
            : get().unreadCountByUserId,
        });
      },

      /**
       * Lấy danh sách tất cả users có thể chat
       */
      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await AxiosInstance.get("/messages/users");
          set({ users: res.data });
        } catch (error) {
          console.log("error in getUsers:", error);
          const errMsg =
            (error as AxiosError<{ message: string }>)?.response?.data
              ?.message || "Something went wrong";
          toast.error(errMsg);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      /**
       * Sắp xếp users theo tin nhắn mới nhất
       */
      getSortedUsers: () => {
        const { users, lastMessageByUserId } = get();

        return [...users].sort((a, b) => {
          const aLastMessage = lastMessageByUserId[a._id];
          const bLastMessage = lastMessageByUserId[b._id];

          if (aLastMessage && bLastMessage) {
            return (
              new Date(bLastMessage.createdAt).getTime() -
              new Date(aLastMessage.createdAt).getTime()
            );
          }

          if (aLastMessage && !bLastMessage) return -1;
          if (!aLastMessage && bLastMessage) return 1;

          return a.fullName.localeCompare(b.fullName);
        });
      },

      /**
       * Lấy tin nhắn với user cụ thể
       * @param userId - ID của user cần lấy tin nhắn
       */
      getMessages: async (userId: string) => {
        set({ isMessagesLoading: true });
        try {
          const res = await AxiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          console.log("error in getMessages:", error);
          const errMsg =
            (error as AxiosError<{ message: string }>)?.response?.data
              ?.message || "Something went wrong";
          toast.error(errMsg);
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      /**
       * Gửi tin nhắn mới (text hoặc image)
       * @param payload - Nội dung tin nhắn và hình ảnh
       */
      sendMessage: async (payload: NewMessagePayload) => {
        const { selectedUser, messages, lastMessageByUserId } = get();
        if (!selectedUser) return;

        try {
          const res = await AxiosInstance.post(
            `/messages/send/${selectedUser._id}`,
            payload
          );

          const lastMsg = res.data as MessageData;
          set({
            messages: [...messages, lastMsg],
            lastMessageByUserId: {
              ...lastMessageByUserId,
              [selectedUser._id]: {
                text: lastMsg.image ? "Sent an image" : lastMsg.message,
                isFromMe: true,
                createdAt: lastMsg.createdAt,
              },
            },
          });
        } catch (error) {
          console.log("error in sendMessage:", error);
          const errMsg =
            (error as AxiosError<{ message: string }>)?.response?.data
              ?.message || "Something went wrong";
          toast.error(errMsg);
        }
      },

      /**
       * Đánh dấu một tin nhắn đã đọc
       * @param messageId - ID của tin nhắn cần mark as read
       */
      markMessageAsRead: async (messageId: string) => {
        try {
          await AxiosInstance.patch(`/messages/${messageId}/read`);
        } catch (error) {
          console.log("error in markMessageAsRead:", error);
        }
      },

      /**
       * Đánh dấu tất cả tin nhắn với user đã đọc
       * @param userId - ID của user cần mark all messages as read
       */
      markAllMessageAsRead: async (userId: string) => {
        try {
          await AxiosInstance.patch(`/messages/read-all/${userId}`);
          set((state) => ({
            unreadCountByUserId: {
              ...state.unreadCountByUserId,
              [userId]: 0,
            },
          }));

          const { socket } = useAuthStore.getState();
          if (socket) {
            socket.emit("mark_all_read", {
              userId: userId,
              readBy: useAuthStore.getState().authUser?._id,
            });
          }
        } catch (error) {
          console.log("error in markAllMessageAsRead:", error);
        }
      },

      /**
       * Subscribe vào các socket events để nhận tin nhắn realtime
       * - newMessage: Tin nhắn mới
       * - user_typing: User đang typing
       * - message_read: Tin nhắn đã đọc
       * - thread_read: Thread đã đọc
       */
      subcribeToMessage: () => {
        const { selectedUser } = get();
        const { socket } = useAuthStore.getState();
        if (!selectedUser || !socket) return;

        // Cleanup previous listeners
        socket.off("newMessage");
        socket.off("user_typing");
        socket.off("message_read");
        socket.off("thread_read");

        // Listen for new messages
        socket.on("newMessage", (newMessage: MessageData) => {
          console.log("Received new message:", newMessage);
          const me = useAuthStore.getState().authUser?._id;
          const isForThisThread =
            (newMessage.senderId === selectedUser._id &&
              newMessage.receiverId === me) ||
            (newMessage.senderId === me &&
              newMessage.receiverId === selectedUser._id);

          const otherUserId =
            newMessage.senderId === me
              ? newMessage.receiverId
              : newMessage.senderId;

          // Cập nhật tin nhắn cuối cùng cho mọi user
          set((state) => ({
            lastMessageByUserId: {
              ...state.lastMessageByUserId,
              [otherUserId]: {
                text: newMessage.image ? "Sent an image" : newMessage.message,
                isFromMe: newMessage.senderId === me,
                createdAt: newMessage.createdAt,
              },
            },
          }));

          if (isForThisThread) {
            // Tin nhắn cho thread đang mở → append và mark read
            set((state) => ({ messages: [...state.messages, newMessage] }));
            if (newMessage.senderId === selectedUser._id) {
              get().markMessageAsRead(newMessage._id);
            }
          } else {
            // Tin nhắn từ thread khác → tăng unread count
            set((state) => ({
              unreadCountByUserId: {
                ...state.unreadCountByUserId,
                [otherUserId]:
                  (state.unreadCountByUserId[otherUserId] || 0) + 1,
              },
            }));
          }
        });

        // Listen for thread read events
        socket.on("thread_read", (data: { by: string; with: string }) => {
          const me = useAuthStore.getState().authUser?._id;
          const otherUserId = data.by === me ? data.with : data.by;
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.receiverId === otherUserId ? { ...msg, isRead: true } : msg
            ),
            unreadCountByUserId: {
              ...state.unreadCountByUserId,
              [otherUserId]: 0,
            },
          }));
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

        // Listen for all messages read events
        socket.on("all_messages_read", (data: { by: string; with: string }) => {
          console.log("All messages read event:", data);
          const me = useAuthStore.getState().authUser?._id;

          if (data.by === me && data.with === selectedUser._id) {
            set((state) => ({
              messages: state.messages.map((msg) => ({
                ...msg,
                isRead: true,
                readAt: new Date().toISOString(),
              })),
            }));
          }
        });
      },

      /**
       * Unsubscribe khỏi tất cả socket events
       */
      unsubcribeFromMessage: () => {
        const { socket } = useAuthStore.getState();
        if (socket) {
          socket.off("newMessage");
          socket.off("user_typing");
          socket.off("message_read");
          socket.off("thread_read");
          socket.off("all_messages_read");
        }
      },

      /**
       * Gửi signal bắt đầu typing
       */
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

      /**
       * Gửi signal dừng typing
       */
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

      /**
       * Load last messages for all users
       */
      loadLastMessages: async () => {
        try {
          const { users } = get();
          if (users.length === 0) return;

          const me = useAuthStore.getState().authUser?._id;
          if (!me) return;

          const lastMessagesPromises = users.map(async (user) => {
            try {
              const res = await AxiosInstance.get(
                `/messages/${user._id}?limit=1&sort=-createdAt`
              );
              if (res.data && res.data.length > 0) {
                const lastMsg = res.data[0];
                return {
                  userId: user._id,
                  message: {
                    text: lastMsg.image ? "Sent an image" : lastMsg.message,
                    isFromMe: lastMsg.senderId === me,
                    createdAt: lastMsg.createdAt,
                  },
                };
              }
            } catch (error) {
              console.log("error in loadLastMessages:", error);
            }
            return null;
          });

          const results = await Promise.all(lastMessagesPromises);
          const validResults = results.filter(Boolean);

          if (validResults.length > 0) {
            set((state) => ({
              lastMessageByUserId: {
                ...state.lastMessageByUserId,
                ...Object.fromEntries(
                  validResults.map((result) => [
                    result?.userId,
                    result?.message,
                  ])
                ),
              },
            }));
          }
        } catch (error) {
          console.log("error in loadLastMessages:", error);
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        selectedUser: state.selectedUser,
        lastMessageByUserId: state.lastMessageByUserId,
        unreadCountByUserId: state.unreadCountByUserId,
      }),
    }
  )
);
