import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeleton/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import TypingIndicator from "./TypingIndicator";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    typingUsers,
    subcribeToMessage,
    unsubcribeFromMessage,
    markAllMessageAsRead,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef<HTMLDivElement>(null);

  const isSelectedUserTyping =
    selectedUser && typingUsers.includes(selectedUser._id);

  useEffect(() => {
    if (!selectedUser?._id || !socket?.connected) return;
    getMessages(selectedUser._id);
    subcribeToMessage();

    markAllMessageAsRead(selectedUser._id);
    return () => unsubcribeFromMessage();
  }, [selectedUser?._id, socket?.connected]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser?._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full">
                <img
                  src={
                    message.senderId === authUser?._id
                      ? authUser?.profilePic ||
                        "https://res.cloudinary.com/dw9bbrnke/image/upload/v1750328296/453178253_471506465671661_2781666950760530985_n_k3uj5r.png"
                      : selectedUser?.profilePic ||
                        "https://res.cloudinary.com/dw9bbrnke/image/upload/v1750328296/453178253_471506465671661_2781666950760530985_n_k3uj5r.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.message && <p>{message.message}</p>}
              {message.senderId === authUser?._id && (
                <span className="flex items-center gap-1">
                  {message.isRead ? (
                    <>
                      <span>✓✓</span>
                      <span className="text-xs">Seen</span>
                    </>
                  ) : (
                    <span>✓</span>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
        {/* Typing Indicator */}
        {isSelectedUserTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full">
                <img
                  src={
                    selectedUser?.profilePic ||
                    "https://res.cloudinary.com/dw9bbrnke/image/upload/v1750328296/453178253_471506465671661_2781666950760530985_n_k3uj5r.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
