import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeleton/SidebarSkeleton";
import { Users } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { getHourAndMinute } from "../lib/utils";
import { BsThreeDots } from "react-icons/bs";
import { CiSearch } from "react-icons/ci";

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

  const formatUnreadCount = (count: number) => {
    if (count < 0) return "";
    if (count > 10) return "10+";
    return count.toString();
  };

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filteredUsers = users.filter((user) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread")
      return (unreadCountByUserId[user._id] || 0) > 0;
    // if (activeFilter === "group") return user.group;
    return false;
  });

  const emptyText = activeFilter === "group" ? "No groups" : "No users";

  useEffect(() => {
    const t = setTimeout(() => {
      getUsers({ q: search || undefined });
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full px-3 py-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 font-bold">
            <Users className="size-8" />
            <span className="text-xl hidden lg:block">Contacts</span>
          </div>
          <div className="rounded-full bg-base-200 w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-base-300 transition-colors duration-200">
            <BsThreeDots className="text-base-content size-5" />
          </div>
        </div>
        <div className="bg-base-200 rounded-lg px-2 py-1 flex items-center gap-2">
          <CiSearch className="text-base-content size-5" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none"
          />
        </div>
        <div className="flex items-center gap-2 px-1 mt-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 rounded-3xl text-sm font-medium cursor-pointer ${
              activeFilter === "all"
                ? "bg-primary text-primary-content"
                : "text-base-content hover:bg-base-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("unread")}
            className={`px-3 py-1 rounded-3xl text-sm font-medium cursor-pointer ${
              activeFilter === "unread"
                ? "bg-primary text-primary-content"
                : "text-base-content bg-base-200 hover:bg-base-300"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilter("group")}
            className={`px-3 py-1 rounded-3xl text-sm font-medium cursor-pointer transition-colors ${
              activeFilter === "group"
                ? "bg-primary text-primary-content"
                : "text-base-content bg-base-200 hover:bg-base-300"
            }`}
          >
            Group
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {isUsersLoading && users.length === 0 ? (
          <SidebarSkeleton />
        ) : (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-200 cursor-pointer transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300 hover:bg-base-300"
                  : ""
              }
            `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <div>
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
                    {formatUnreadCount(unreadCountByUserId[user._id])}
                  </span>
                )}
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">{emptyText}</div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
