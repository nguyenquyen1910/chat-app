import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeleton/SidebarSkeleton";
import { Users } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { getHourAndMinute } from "../lib/utils";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const {
    getUsers,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCountByUserId,
    users,
  } = useChatStore();

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    navigate(`/chat/${user._id}`, { replace: true });
  };

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const formatLastMessage = (user: any) => {
    if (
      !user.lastMessage ||
      (!user.lastMessage.text && !user.lastMessage.image)
    ) {
      return "Now you can message each other";
    }

    if (user.lastMessage.image && !user.lastMessage.text) {
      const isOwnMessage = user.lastMessage.senderId === authUser?._id;
      return isOwnMessage ? "You: Sent an image" : "Sent an image";
    }

    const isOwnMessage = user.lastMessage.senderId === authUser?._id;
    return isOwnMessage
      ? `You: ${user.lastMessage.text}`
      : user.lastMessage.text;
  };

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isUsersLoading) return <SidebarSkeleton />;
  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => handleUserSelect(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={
                  user.profilePic ||
                  "https://res.cloudinary.com/dw9bbrnke/image/upload/v1750328296/453178253_471506465671661_2781666950760530985_n_k3uj5r.png"
                }
                alt={user.fullName}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left flex-1 min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>

              <div className="flex items-center justify-between gap-2 mt-1">
                <div
                  className={`text-sm truncate flex-1 ${
                    (unreadCountByUserId[user._id] || 0) > 0
                      ? "font-semibold text-base-content"
                      : "text-zinc-400"
                  }`}
                >
                  {formatLastMessage(user)}
                </div>

                <div className="text-xs text-zinc-500 flex-shrink-0">
                  {user.lastMessage?.createdAt
                    ? getHourAndMinute(user.lastMessage.createdAt)
                    : ""}
                </div>
              </div>
            </div>

            {(unreadCountByUserId[user._id] || 0) > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-content text-xs">
                {unreadCountByUserId[user._id]}
              </span>
            )}
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
