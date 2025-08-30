import useAuthStore from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="relative size-10">
              <img
                src={
                  selectedUser?.profilePic ||
                  "https://res.cloudinary.com/dw9bbrnke/image/upload/v1750328296/453178253_471506465671661_2781666950760530985_n_k3uj5r.png"
                }
                alt={selectedUser?.fullName}
                className="rounded-full"
              />
              {onlineUsers.includes(selectedUser?._id || "") && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser?.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser?._id || "")
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          className="cursor-pointer hover:scale-105 transition-all duration-200"
          onClick={() => setSelectedUser(null)}
        >
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
