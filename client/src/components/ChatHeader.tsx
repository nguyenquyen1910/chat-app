import useAuthStore from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";
import { formatLastSeen } from "../lib/utils";
import { useNavigate } from "react-router-dom";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  const handleCloseChat = () => {
    setSelectedUser(null);
    localStorage.removeItem("selectedUserId");
  };

  const handleOpenProfile = () => {
    if (!selectedUser) return;
    navigate(`/profile/${selectedUser._id}`);
  };

  const getStatusText = () => {
    if (onlineUsers.includes(selectedUser?._id || "")) {
      return "Online";
    }

    if (selectedUser?.lastSeen) {
      const lastSeenText = formatLastSeen(selectedUser.lastSeen);
      return lastSeenText || "Offline";
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="relative avatar cursor-pointer"
            onClick={handleOpenProfile}
          >
            <div className="size-10">
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
          <div className="cursor-pointer" onClick={handleOpenProfile}>
            <h3 className="font-medium">{selectedUser?.fullName}</h3>
            <p className="text-sm text-base-content/70">{getStatusText()}</p>
          </div>
        </div>

        {/* Close button */}
        <button
          className="cursor-pointer hover:scale-105 transition-all duration-200"
          onClick={handleCloseChat}
        >
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
